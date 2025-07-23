package app.affine.pro.plugin

import android.annotation.SuppressLint
import app.affine.pro.service.CookieStore
import app.affine.pro.service.OkHttp
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.coroutines.executeAsync
import org.json.JSONObject
import timber.log.Timber

@OptIn(ExperimentalCoroutinesApi::class)
@CapacitorPlugin(name = "Auth")
class AuthPlugin : Plugin() {

    @PluginMethod
    fun signInMagicLink(call: PluginCall) {
        processSignIn(call, SignInMethod.MagicLink)
    }

    @PluginMethod
    fun signInOauth(call: PluginCall) {
        processSignIn(call, SignInMethod.Oauth)
    }

    @SuppressLint("BuildListAdds")
    @PluginMethod
    fun signInPassword(call: PluginCall) {
        processSignIn(call, SignInMethod.Password)
    }

    @PluginMethod
    fun signOut(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                val endpoint = call.getStringEnsure("endpoint")
                val request = Request.Builder()
                    .url("$endpoint/api/auth/sign-out")
                    .get()
                    .build()
                OkHttp.client.newCall(request).executeAsync().use { response ->
                    if (response.code >= 400) {
                        call.reject(response.body.string())
                        return@launch
                    }
                    
                    // 🔥 新增：清除JWT认证信息
                    try {
                        val serverHost = endpoint.toHttpUrl().host
                        app.affine.pro.AuthInitializer.clearJwtAuth(serverHost)
                        android.util.Log.d("AuthPlugin", "JWT认证信息已清除")
                    } catch (e: Exception) {
                        android.util.Log.w("AuthPlugin", "清除JWT认证信息失败: ${e.message}", e)
                    }
                    
                    Timber.i("Sign out success.")
                    call.resolve(JSObject().put("ok", true))
                }
            } catch (e: Exception) {
                Timber.w(e, "Sign out fail.")
                call.reject("Failed to sign out, $e", null, e)
            }
        }
    }

    private enum class SignInMethod {
        Password, Oauth, MagicLink
    }

    private fun processSignIn(call: PluginCall, method: SignInMethod) {
        launch(Dispatchers.IO) {
            try {
                val endpoint = call.getStringEnsure("endpoint")
                android.util.Log.d("AuthPlugin", "=== processSignIn 开始 ===")
                android.util.Log.d("AuthPlugin", "认证方法: $method")
                android.util.Log.d("AuthPlugin", "endpoint: $endpoint")
                
                val request = when (method) {
                    SignInMethod.Password -> {
                        val email = call.getStringEnsure("email")
                        val password = call.getStringEnsure("password")
                        val verifyToken = call.getString("verifyToken")
                        val challenge = call.getString("challenge")
                        
                        android.util.Log.d("AuthPlugin", "密码登录参数:")
                        android.util.Log.d("AuthPlugin", "- email: $email")
                        android.util.Log.d("AuthPlugin", "- password长度: ${password.length}")
                        android.util.Log.d("AuthPlugin", "- verifyToken: $verifyToken")
                        android.util.Log.d("AuthPlugin", "- challenge: $challenge")
                        
                        val body = JSONObject()
                            .apply {
                                put("email", email)
                                put("password", password)
                            }
                            .toString()
                            .toRequestBody("application/json".toMediaTypeOrNull())

                        val requestBuilder = Request.Builder()
                            .url("$endpoint/api/auth/sign-in")
                            .post(body)
                            
                        android.util.Log.d("AuthPlugin", "请求URL: $endpoint/api/auth/sign-in")
                        android.util.Log.d("AuthPlugin", "请求体: ${JSONObject().apply { put("email", email); put("password", "***") }}")
                            
                        if (verifyToken != null) {
                            requestBuilder.addHeader("x-captcha-token", verifyToken)
                            android.util.Log.d("AuthPlugin", "添加x-captcha-token头")
                        }
                        if (challenge != null) {
                            requestBuilder.addHeader("x-captcha-challenge", challenge)
                            android.util.Log.d("AuthPlugin", "添加x-captcha-challenge头")
                        }
                        requestBuilder.build()
                    }

                    SignInMethod.Oauth -> {
                        val code = call.getStringEnsure("code")
                        val state = call.getStringEnsure("state")
                        val clientNonce = call.getString("clientNonce")
                        val body = JSONObject()
                            .apply {
                                put("code", code)
                                put("state", state)
                                put("client_nonce", clientNonce)
                            }
                            .toString()
                            .toRequestBody("application/json".toMediaTypeOrNull())

                        Request.Builder()
                            .url("$endpoint/api/oauth/callback")
                            .post(body)
                            .build()
                    }

                    SignInMethod.MagicLink -> {
                        val email = call.getStringEnsure("email")
                        val token = call.getStringEnsure("token")
                        val clientNonce = call.getString("clientNonce")
                        val body = JSONObject()
                            .apply {
                                put("email", email)
                                put("token", token)
                                put("client_nonce", clientNonce)
                            }
                            .toString()
                            .toRequestBody("application/json".toMediaTypeOrNull())

                        Request.Builder()
                            .url("$endpoint/api/auth/magic-link")
                            .post(body)
                            .build()
                    }
                }

                android.util.Log.d("AuthPlugin", "开始发送HTTP请求...")
                android.util.Log.d("AuthPlugin", "请求详情:")
                android.util.Log.d("AuthPlugin", "- URL: ${request.url}")
                android.util.Log.d("AuthPlugin", "- Method: ${request.method}")
                android.util.Log.d("AuthPlugin", "- Headers: ${request.headers}")

                OkHttp.client.newCall(request).executeAsync().use { response ->
                    android.util.Log.d("AuthPlugin", "收到HTTP响应:")
                    android.util.Log.d("AuthPlugin", "- 状态码: ${response.code}")
                    android.util.Log.d("AuthPlugin", "- 响应头: ${response.headers}")
                    
                    if (response.code >= 400) {
                        val errorBody = response.body.string()
                        android.util.Log.e("AuthPlugin", "请求失败: HTTP ${response.code}")
                        android.util.Log.e("AuthPlugin", "错误响应体: $errorBody")
                        call.reject(errorBody)
                        return@launch
                    }
                    
                    // 解析响应体中的JWT token数据
                    val responseBody = response.body.string()
                    android.util.Log.d("AuthPlugin", "响应体: $responseBody")
                    Timber.d("Response body: $responseBody")
                    
                    try {
                        val jsonResponse = JSONObject(responseBody)
                        android.util.Log.d("AuthPlugin", "解析响应JSON成功")
                        
                        // 检查响应是否成功
                        val success = jsonResponse.optBoolean("success", false)
                        android.util.Log.d("AuthPlugin", "响应成功标记: $success")
                        
                        if (!success) {
                            android.util.Log.e("AuthPlugin", "${method} 登录失败: success=false")
                            call.reject("${method} sign in failed: success=false")
                            return@launch
                        }
                        
                        // 提取token数据
                        val token = jsonResponse.optString("token", "")
                        val refreshToken = jsonResponse.optString("refreshToken", "")
                        val expiresIn = jsonResponse.optLong("expiresIn", 0)
                        
                        android.util.Log.d("AuthPlugin", "提取的token数据:")
                        android.util.Log.d("AuthPlugin", "- token长度: ${token.length}")
                        android.util.Log.d("AuthPlugin", "- token前缀: ${token.take(20)}...")
                        android.util.Log.d("AuthPlugin", "- refreshToken长度: ${refreshToken.length}")
                        android.util.Log.d("AuthPlugin", "- expiresIn: $expiresIn")
                        
                        if (token.isEmpty()) {
                            android.util.Log.e("AuthPlugin", "${method} 登录失败: token为空")
                            call.reject("${method} sign in fail, token not found in response")
                            return@launch
                        }
                        
                        // 提取用户信息
                        val user = jsonResponse.optJSONObject("user")
                        android.util.Log.d("AuthPlugin", "用户信息: $user")
                        
                        // 构建返回结果
                        val result = JSObject().apply {
                            put("success", true)
                            put("token", token)
                            put("refreshToken", refreshToken)
                            put("expiresIn", expiresIn)
                            if (user != null) {
                                put("user", JSObject().apply {
                                    put("id", user.optString("id", ""))
                                    put("email", user.optString("email", ""))
                                    put("name", user.optString("name", ""))
                                    put("emailVerified", user.optBoolean("emailVerified", false))
                                    put("hasPassword", user.optBoolean("hasPassword", false))
                                })
                            }
                        }
                        
                        android.util.Log.d("AuthPlugin", "${method} 登录成功!")
                        android.util.Log.d("AuthPlugin", "返回结果: $result")
                        Timber.i("$method sign in success.")
                        Timber.d("Token: ${token.substring(0, 20)}...")
                        
                        // 🔥 新增：保存JWT认证信息到DataStore
                        try {
                            val serverHost = endpoint.toHttpUrl().host
                            app.affine.pro.AuthInitializer.saveJwtAuth(
                                serverHost = serverHost,
                                jwtToken = token,
                                refreshToken = if (refreshToken.isNotEmpty()) refreshToken else null,
                                userInfo = user?.toString()
                            )
                            android.util.Log.d("AuthPlugin", "JWT认证信息已保存到DataStore")
                        } catch (e: Exception) {
                            android.util.Log.w("AuthPlugin", "保存JWT认证信息失败: ${e.message}", e)
                        }
                        
                        call.resolve(result)
                        
                    } catch (e: Exception) {
                        android.util.Log.e("AuthPlugin", "解析响应JSON失败: ${e.message}", e)
                        Timber.w(e, "Failed to parse response JSON")
                        call.reject("Failed to parse response: ${e.message}")
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("AuthPlugin", "$method 登录异常: ${e.message}", e)
                Timber.w(e, "$method sign in fail.")
                call.reject("$method sign in fail.", null, e)
            }
        }
    }
}
