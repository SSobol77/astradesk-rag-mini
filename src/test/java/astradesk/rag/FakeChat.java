// src/test/java/astradesk/rag/FakeChat.java
package astradesk.rag;

import com.astradesk.rag.service.ChatLLM;
import java.util.List;

public class FakeChat implements ChatLLM {
    @Override public String answer(String question, List<String> contexts) {
        return "FAKE_ANSWER:" + question + " | ctx=" + contexts.size();
    }
}
