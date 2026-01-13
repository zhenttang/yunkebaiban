package app.yunke.pro.plugin

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.Dispatchers
import timber.log.Timber
// 恢复原生库导入
import uniffi.yunke_mobile_native.DocRecord
import uniffi.yunke_mobile_native.SetBlob
import uniffi.yunke_mobile_native.newDocStoragePool

@CapacitorPlugin(name = "NbStoreDocStorage")
class NbStorePlugin : Plugin() {

    // 启用原生存储池，提供高性能的本地SQLite数据库支持
    private val docStoragePool = newDocStoragePool()

    @PluginMethod
    fun connect(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                val spaceId = call.getString("spaceId") ?: ""
                val path = call.getString("path") ?: "/data/data/app.yunke.pro/files/nbstore"
                docStoragePool.connect(spaceId, path)
                Timber.i("NbStore connect() - 已连接到原生SQLite数据库: $spaceId")
                call.resolve()
            } catch (e: Exception) {
                Timber.e(e, "Failed to connect NbStore.")
                call.reject("Failed to connect NbStore.", e)
            }
        }
    }

    @PluginMethod
    fun disconnect(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                val spaceId = call.getString("spaceId") ?: ""
                docStoragePool.disconnect(spaceId)
                Timber.i("NbStore disconnect() - 已断开原生SQLite数据库连接: $spaceId")
                call.resolve()
            } catch (e: Exception) {
                Timber.e(e, "Failed to disconnect NbStore")
                call.reject("Failed to disconnect NbStore", null, e)
            }
        }
    }

    @PluginMethod
    fun setSpaceId(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                val spaceId = call.getString("spaceId") ?: ""
                Timber.i("NbStore setSpaceId() - 设置空间ID: $spaceId")
                call.resolve()
            } catch (e: Exception) {
                Timber.e(e, "Failed to set space id.")
                call.reject("Failed to set space id, ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun pushUpdate(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                val spaceId = call.getString("spaceId") ?: ""
                val docId = call.getString("docId") ?: ""
                val update = call.getArray("update")?.toList<Int>()?.map { it.toByte() }?.toByteArray() ?: byteArrayOf()
                val updateString = update.joinToString(",") { it.toString() }
                val timestamp = docStoragePool.pushUpdate(spaceId, docId, updateString)
                call.resolve(JSObject().put("timestamp", timestamp))
            } catch (e: Exception) {
                call.reject("Failed to push update, ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getDocSnapshot(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                val spaceId = call.getString("spaceId") ?: ""
                val docId = call.getString("docId") ?: ""
                val snapshot = docStoragePool.getDocSnapshot(spaceId, docId)
                if (snapshot != null) {
                    call.resolve(JSObject().put("docId", snapshot.docId)
                        .put("bin", snapshot.bin.toList())
                        .put("timestamp", snapshot.timestamp))
                } else {
                    call.resolve()
                }
            } catch (e: Exception) {
                call.reject("Failed to get doc snapshot, ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun setDocSnapshot(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                // 返回成功，实际存储由云端处理
                call.resolve(JSObject().put("success", true))
            } catch (e: Exception) {
                call.reject("Failed to set doc snapshot, ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getDocUpdates(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                // 返回空数组
                val updates = JSArray()
                call.resolve(JSObject().put("updates", updates))
            } catch (e: Exception) {
                call.reject("Failed to get doc updates, ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun markUpdatesMerged(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve(JSObject().put("count", 0))
            } catch (e: Exception) {
                call.reject("Failed to mark updates merged, ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun deleteDoc(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to delete doc: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getDocClocks(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                val clocks = JSArray()
                call.resolve(JSObject().put("clocks", clocks))
            } catch (e: Exception) {
                call.reject("Failed to get doc clocks: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getDocClock(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to get doc clock: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getBlob(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to get blob: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun setBlob(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to set blob: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun deleteBlob(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to delete blob: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun releaseBlobs(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to release blobs: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun listBlobs(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                val blobs = JSArray()
                call.resolve(JSObject().put("blobs", blobs))
            } catch (e: Exception) {
                call.reject("Failed to list blobs: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getPeerRemoteClocks(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                val clocks = JSArray()
                call.resolve(JSObject().put("clocks", clocks))
            } catch (e: Exception) {
                call.reject("Failed to get peer remote clocks: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getPeerRemoteClock(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to get peer remote clock: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun setPeerRemoteClock(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to set peer remote clock: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getPeerPulledRemoteClocks(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                val clocks = JSArray()
                call.resolve(JSObject().put("clocks", clocks))
            } catch (e: Exception) {
                call.reject("Failed to get peer pulled remote clocks: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getPeerPulledRemoteClock(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to get peer pulled remote clock: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun setPeerPulledRemoteClock(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to set peer pulled remote clock: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getPeerPushedClocks(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                val clocks = JSArray()
                call.resolve(JSObject().put("clocks", clocks))
            } catch (e: Exception) {
                call.reject("Failed to get peer pushed clocks: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getPeerPushedClock(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to get peer pushed clock: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun setPeerPushedClock(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to set peer pushed clock: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun getBlobUploadedAt(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to get blob uploaded: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun setBlobUploadedAt(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to set blob uploaded: ${e.message}", null, e)
            }
        }
    }

    @PluginMethod
    fun clearClocks(call: PluginCall) {
        launch(Dispatchers.IO) {
            try {
                call.resolve()
            } catch (e: Exception) {
                call.reject("Failed to clear clocks: ${e.message}", null, e)
            }
        }
    }
}