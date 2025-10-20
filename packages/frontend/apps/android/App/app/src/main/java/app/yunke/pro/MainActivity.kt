package app.yunke.pro

import android.content.res.ColorStateList
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.webkit.WebSettings
import androidx.coordinatorlayout.widget.CoordinatorLayout
import androidx.core.content.ContextCompat
import androidx.core.graphics.drawable.DrawableCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.updateMargins
import androidx.lifecycle.lifecycleScope
import androidx.vectordrawable.graphics.drawable.VectorDrawableCompat
// import app.yunke.pro.ai.AIActivity  // 禁用AI功能
import app.yunke.pro.plugin.AIButtonPlugin
import app.yunke.pro.plugin.YUNKEThemePlugin
import app.yunke.pro.plugin.AuthPlugin
import app.yunke.pro.plugin.HashCashPlugin
import app.yunke.pro.plugin.NbStorePlugin
// import app.yunke.pro.service.GraphQLService  // 禁用GraphQL
import app.yunke.pro.service.SSEService
import app.yunke.pro.service.WebService
import app.yunke.pro.utils.px2dp
import app.yunke.pro.utils.dp2px
import com.getcapacitor.BridgeActivity
import com.google.android.material.floatingactionbutton.FloatingActionButton
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject


@AndroidEntryPoint
class MainActivity : BridgeActivity(), AIButtonPlugin.Callback, YUNKEThemePlugin.Callback,
    View.OnClickListener {

    @Inject
    lateinit var webService: WebService

    @Inject
    lateinit var sseService: SSEService

    // @Inject  // 禁用GraphQL服务
    // lateinit var graphQLService: GraphQLService

    init {
        registerPlugins(
            listOf(
                YUNKEThemePlugin::class.java,
                AIButtonPlugin::class.java,
                AuthPlugin::class.java,
                HashCashPlugin::class.java,
                NbStorePlugin::class.java,
            )
        )
    }

    private val fab: FloatingActionButton by lazy {
        FloatingActionButton(this).apply {
            visibility = View.GONE
            layoutParams = CoordinatorLayout.LayoutParams(dp2px(52), dp2px(52)).apply {
                gravity = Gravity.END or Gravity.BOTTOM
                updateMargins(0, 0, dp2px(24), dp2px(86))
            }
            customSize = dp2px(52)
            setImageResource(R.drawable.ic_ai)
            setImageDrawable(
                VectorDrawableCompat.create(resources, R.drawable.ic_ai, theme)?.apply {
                    DrawableCompat.setTint(
                        this,
                        ContextCompat.getColor(context, R.color.yunke_primary)
                    )
                })
            setOnClickListener(this@MainActivity)
            val parent = bridge.webView.parent as CoordinatorLayout
            parent.addView(this)
        }
    }

    private var navHeight = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        android.util.Log.d("YunkeApp", "=== MainActivity onCreate 开始 ===")
        android.util.Log.d("YunkeApp", "应用包名: ${packageName}")
        android.util.Log.d("YunkeApp", "应用版本: ${packageManager.getPackageInfo(packageName, 0).versionName}")
        android.util.Log.d("YunkeApp", "系统版本: ${android.os.Build.VERSION.RELEASE}")
        android.util.Log.d("YunkeApp", "设备型号: ${android.os.Build.MODEL}")
        
        // 配置WebView存储设置 - 启用IndexedDB支持
        bridge.webView.settings.apply {
            domStorageEnabled = true           // 启用DOM存储 (localStorage, sessionStorage)
            databaseEnabled = true            // 启用数据库 (WebSQL, IndexedDB)
            javaScriptEnabled = true          // 启用JavaScript
            allowFileAccess = true            // 允许文件访问
            allowContentAccess = true         // 允许内容访问
            cacheMode = WebSettings.LOAD_DEFAULT  // 默认缓存模式
            android.util.Log.d("YunkeApp", "✅ WebView存储配置已启用")
        }
        
        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { v, insets ->
            navHeight = px2dp(insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom)
            android.util.Log.d("YunkeApp", "导航栏高度: $navHeight dp")
            ViewCompat.onApplyWindowInsets(v, insets)
        }
        
        android.util.Log.d("YunkeApp", "=== MainActivity onCreate 完成 ===")
    }

    override fun load() {
        super.load()
        android.util.Log.d("YunkeApp", "=== MainActivity.load() 开始 ===")
        AuthInitializer.initialize(bridge)
        android.util.Log.d("YunkeApp", "=== MainActivity.load() 完成 ===")
    }

    override fun present() {
        lifecycleScope.launch {
            fab.show()
        }
    }

    override fun dismiss() {
        lifecycleScope.launch {
            fab.hide()
        }
    }

    override fun onThemeChanged(darkMode: Boolean) {
        lifecycleScope.launch {
            fab.backgroundTintList = ColorStateList.valueOf(
                ContextCompat.getColor(
                    this@MainActivity,
                    if (darkMode) {
                        R.color.layer_background_primary_dark
                    } else {
                        R.color.layer_background_primary
                    }
                )
            )
        }
    }

    override fun getSystemNavBarHeight(): Int {
        return navHeight
    }

    override fun onClick(v: View) {
        lifecycleScope.launch {
            webService.update(bridge)
            sseService.updateServer(bridge)
            // graphQLService.updateServer(bridge)  // 禁用GraphQL
            // AIActivity.open(this@MainActivity)  // 禁用AI功能
        }
    }

}
