/**
 * SSE Streaming client using fetch with ReadableStream for low-latency token streaming.
 */
export async function streamChatResponse({
  conversationId,
  content,
  model,
  onDelta,
  onDone,
  onError,
  signal,
}) {
  const token = localStorage.getItem('access_token');
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  try {
    const response = await fetch(`${API_BASE_URL}/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        content,
        model,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP error ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing line

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        if (trimmed.startsWith('data:')) {
          const jsonStr = trimmed.replace(/^data:\s*/, '');
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.delta) {
              onDelta?.(parsed.delta);
            }
            if (parsed.error) {
              onError?.(new Error(parsed.error));
            }
          } catch (e) {
            // raw text token
            if (jsonStr !== '{}') {
              onDelta?.(jsonStr);
            }
          }
        } else if (trimmed.startsWith('event: done')) {
          onDone?.();
        }
      }
    }

    onDone?.();
  } catch (err) {
    if (err.name === 'AbortError') {
      onDone?.();
      return;
    }
    onError?.(err);
  }
}
