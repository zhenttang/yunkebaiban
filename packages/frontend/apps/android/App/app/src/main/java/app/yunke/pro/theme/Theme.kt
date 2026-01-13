package app.yunke.pro.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable

object YUNKETheme {
    val colors: YUNKEColorScheme
        @ReadOnlyComposable
        @Composable
        get() = LocalYUNKEColors.current

    val typography: YUNKETypography
        @ReadOnlyComposable
        @Composable
        get() = LocalYUNKETypography.current
}

@Composable
fun YUNKETheme(
    mode: ThemeMode = ThemeMode.System,
    content: @Composable () -> Unit
) {
    val colors = when (mode) {
        ThemeMode.Light -> yunkeLightScheme
        ThemeMode.Dark -> yunkeDarkScheme
        ThemeMode.System -> if (isSystemInDarkTheme()) yunkeDarkScheme else yunkeLightScheme
    }

    CompositionLocalProvider(LocalYUNKEColors provides colors) {
        MaterialTheme {
            content()
        }
    }
}

enum class ThemeMode(name: String) {
    Light("light"),
    Dark("dark"),
    System("system");

    fun of(name: String) = when (name) {
        "light" -> Light
        "dark" -> Dark
        else -> System
    }
}