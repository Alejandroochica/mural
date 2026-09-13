package chat.mural

import android.content.Context
import android.util.AtomicFile
import chat.mural.core.Archive
import chat.mural.core.ArchiveCodec
import chat.mural.core.nowSeconds
import java.io.File
import java.io.ByteArrayOutputStream

/** App-private archive; API credentials are deliberately kept elsewhere. */
class LearningRepository(context: Context) {
    private val file = AtomicFile(File(context.filesDir, "learning.json"))
    fun load(): Archive {
        if (!file.baseFile.exists() && !File(file.baseFile.path + ".bak").exists()) return Archive()
        val archive = file.openRead().use { input ->
            val output = ByteArrayOutputStream()
            val buffer = ByteArray(65536)
            while (true) {
                val count = input.read(buffer)
                if (count < 0) break
                require(output.size() + count <= ArchiveCodec.MAXIMUM_ENCODED_BYTES) { "El respaldo local es demasiado grande." }
                output.write(buffer, 0, count)
            }
            ArchiveCodec.decode(output.toString(Charsets.UTF_8.name()))
        }
        val unfinished = archive.sessions.filter { it.endedAt == null }
        val recoveredAt = nowSeconds()
        unfinished.forEach {
            it.endedAt = recoveredAt; it.endReason = "App closed before finalization"
        }
        if (unfinished.isNotEmpty()) save(archive)
        return archive
    }
    fun save(archive: Archive) {
        val bytes = ArchiveCodec.encode(archive).toByteArray(Charsets.UTF_8)
        require(bytes.size <= ArchiveCodec.MAXIMUM_ENCODED_BYTES) { "The learning archive reached its storage limit; export a backup." }
        val stream = file.startWrite()
        try { stream.write(bytes); file.finishWrite(stream) }
        catch (e: Exception) { file.failWrite(stream); throw e }
    }
}
