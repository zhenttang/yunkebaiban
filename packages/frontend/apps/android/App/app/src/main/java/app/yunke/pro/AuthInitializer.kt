package app.affine.pro

import android.webkit.WebView
import app.affine.pro.utils.dataStore
import app.affine.pro.utils.get
import app.affine.pro.utils.set
import app.affine.pro.utils.getCurrentServerBaseUrl
// import app.affine.pro.utils.logger.FileTree  // 禁用Firebase相关功能
import com.getcapacitor.Bridge
import com.getcapacitor.WebViewListener
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch
import okhttp3.HttpUrl.Companion.toHttpUrl
import timber.log.Timber

/**
 * Android专用JWT认证初始化器
 * 不再使用Cookie，改为JWT Token认证
 */
object AuthInitializer {

    // 常量定义直接放在object中
    const val JWT_TOKEN_KEY = "affine_jwt_token"
    const val JWT_REFRESH_TOKEN_KEY = "affine_jwt_refresh_token"
    const val USER_INFO_KEY = "affine_user_info"

    fun initialize(bridge: Bridge) {
        bridge.addWebViewListener(object : WebViewListener() {
            override fun onPageLoaded(webView: WebView?) {
                bridge.removeWebViewListener(this)
                MainScope().launch(Dispatchers.IO) {
                    try {
                        val server = bridge.getCurrentServerBaseUrl().toHttpUrl()
                        val serverHost = server.host
                        
                        Timber.i("[JWT Init] 检查JWT认证状态，服务器: $serverHost")
                        
                        // 从DataStore读取JWT Token
                        val jwtToken = AFFiNEApp.context().dataStore
                            .get("$serverHost:$JWT_TOKEN_KEY")
                        val refreshToken = AFFiNEApp.context().dataStore
                            .get("$serverHost:$JWT_REFRESH_TOKEN_KEY") 
                        val userInfo = AFFiNEApp.context().dataStore
                            .get("$serverHost:$USER_INFO_KEY")
                        
                        if (jwtToken.isEmpty()) {
                            Timber.i("[JWT Init] 用户未登录 - 没有JWT Token")
                            return@launch
                        }
                        
                        Timber.i("[JWT Init] 找到JWT Token，长度: ${jwtToken.length}")
                        Timber.i("[JWT Init] Refresh Token存在: ${refreshToken.isNotEmpty()}")
                        Timber.i("[JWT Init] 用户信息存在: ${userInfo.isNotEmpty()}")
                        
                        // 将JWT Token注入到WebView的localStorage中供前端使用
                        MainScope().launch(Dispatchers.Main) {
                            val jsCode = """
                                (function() {
                                    console.log('[JWT Init] 注入JWT Token到localStorage');
                                    localStorage.setItem('affine-admin-token', '$jwtToken');
                                    if ('$refreshToken' !== '') {
                                        localStorage.setItem('affine-refresh-token', '$refreshToken');
                                    }
                                    if ('$userInfo' !== '') {
                                        localStorage.setItem('affine-user-info', '$userInfo');
                                    }
                                    console.log('[JWT Init] JWT Token注入完成');
                                    
                                    // 触发认证状态更新事件
                                    window.dispatchEvent(new CustomEvent('affine-auth-initialized', {
                                        detail: { token: '$jwtToken', server: '$serverHost' }
                                    }));
                                })();
                            """.trimIndent()
                            
                            webView?.evaluateJavascript(jsCode) { result ->
                                Timber.i("[JWT Init] JavaScript注入结果: $result")
                            }
                        }
                        
                        // FileTree.get()?.checkAndUploadOldLogs(server)  // 禁用日志上传功能
                    } catch (e: Exception) {
                        Timber.w(e, "[JWT Init] JWT认证初始化失败")
                    }
                }
            }
        })
    }

    /**
     * 保存JWT认证信息到DataStore
     */
    suspend fun saveJwtAuth(serverHost: String, jwtToken: String, refreshToken: String? = null, userInfo: String? = null) {
        try {
            val dataStore = AFFiNEApp.context().dataStore
            
            // 保存JWT Token
            dataStore.set("$serverHost:$JWT_TOKEN_KEY", jwtToken)
            Timber.i("[JWT Save] JWT Token已保存，服务器: $serverHost")
            
            // 保存Refresh Token
            if (!refreshToken.isNullOrEmpty()) {
                dataStore.set("$serverHost:$JWT_REFRESH_TOKEN_KEY", refreshToken)
                Timber.i("[JWT Save] Refresh Token已保存")
            }
            
            // 保存用户信息
            if (!userInfo.isNullOrEmpty()) {
                dataStore.set("$serverHost:$USER_INFO_KEY", userInfo)
                Timber.i("[JWT Save] 用户信息已保存")
            }
        } catch (e: Exception) {
            Timber.e(e, "[JWT Save] 保存JWT认证信息失败")
        }
    }

    /**
     * 清除JWT认证信息
     */
    suspend fun clearJwtAuth(serverHost: String) {
        try {
            val dataStore = AFFiNEApp.context().dataStore
            dataStore.set("$serverHost:$JWT_TOKEN_KEY", "")
            dataStore.set("$serverHost:$JWT_REFRESH_TOKEN_KEY", "")
            dataStore.set("$serverHost:$USER_INFO_KEY", "")
            
            Timber.i("[JWT Clear] JWT认证信息已清除，服务器: $serverHost")
        } catch (e: Exception) {
            Timber.e(e, "[JWT Clear] 清除JWT认证信息失败")
        }
    }

}