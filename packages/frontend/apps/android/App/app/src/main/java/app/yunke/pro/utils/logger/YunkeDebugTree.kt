package app.yunke.pro.utils.logger

import timber.log.Timber

class YunkeDebugTree : Timber.DebugTree() {

    override fun createStackElementTag(element: StackTraceElement): String {
        return "Yunke:${super.createStackElementTag(element)}:${element.lineNumber}"
    }
}