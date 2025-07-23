package app.affine.pro

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
// import app.affine.pro.ai.AIActivity  // 禁用AI功能
import app.affine.pro.plugin.AIButtonPlugin
import app.affine.pro.plugin.AFFiNEThemePlugin
import app.affine.pro.plugin.AuthPlugin
import app.affine.pro.plugin.HashCashPlugin
import app.affine.pro.plugin.NbStorePlugin
// import app.affine.pro.service.GraphQLService  // 禁用GraphQL
import app.affine.pro.service.SSEService
import app.affine.pro.service.WebService
import app.affine.pro.utils.px2dp
import app.affine.pro.utils.dp2px
import com.getcapacitor.BridgeActivity
import com.google.android.material.floatingactionbutton.FloatingActionButton
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import javax.inject.Inject


@AndroidEntryPoint
class MainActivity : BridgeActivity(), AIButtonPlugin.Callback, AFFiNEThemePlugin.Callback,
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
                AFFiNEThemePlugin::class.java,
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
                        ContextCompat.getColor(context, R.color.affine_primary)
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
        
        android.util.Log.d("AffineApp", "=== MainActivity onCreate 开始 ===")
        android.util.Log.d("AffineApp", "应用包名: ${packageName}")
        android.util.Log.d("AffineApp", "应用版本: ${packageManager.getPackageInfo(packageName, 0).versionName}")
        android.util.Log.d("AffineApp", "系统版本: ${android.os.Build.VERSION.RELEASE}")
        android.util.Log.d("AffineApp", "设备型号: ${android.os.Build.MODEL}")
        
        ViewCompat.setOnApplyWindowInsetsListener(window.decorView) { v, insets ->
            navHeight = px2dp(insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom)
            android.util.Log.d("AffineApp", "导航栏高度: $navHeight dp")
            ViewCompat.onApplyWindowInsets(v, insets)
        }
        
        android.util.Log.d("AffineApp", "=== MainActivity onCreate 完成 ===")
    }

    override fun load() {
        super.load()
        android.util.Log.d("AffineApp", "=== MainActivity.load() 开始 ===")
        AuthInitializer.initialize(bridge)
        android.util.Log.d("AffineApp", "=== MainActivity.load() 完成 ===")
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
