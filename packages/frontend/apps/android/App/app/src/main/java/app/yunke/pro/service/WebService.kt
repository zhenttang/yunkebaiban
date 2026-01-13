package app.yunke.pro.service

import app.yunke.pro.utils.getCurrentDocContentInMarkdown
import app.yunke.pro.utils.getCurrentDocId
import app.yunke.pro.utils.getCurrentWorkspaceId
import com.getcapacitor.Bridge
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class WebService @Inject constructor() {

    suspend fun update(bridge: Bridge) {
        _workspaceId = bridge.getCurrentWorkspaceId()
        _docId = bridge.getCurrentDocId()
        _docContentInMD = bridge.getCurrentDocContentInMarkdown()
    }

    private lateinit var _workspaceId: String
    private lateinit var _docId: String
    private lateinit var _docContentInMD: String

    fun workspaceId() = _workspaceId

    fun docId() = _docId

    fun docContentInMD() = _docContentInMD
}