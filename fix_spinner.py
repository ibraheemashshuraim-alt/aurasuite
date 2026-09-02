import re

with open('frontend/app/dashboard/page.js', 'r', encoding='utf-8') as f:
    d = f.read()

# I will wrap the entire try block contents of handleSendMessage into a timeout-able function.
# Or better, just add a 5 second fallback timeout inside finally that forcefully resets it if it somehow got stuck.
fallback_js = """      } finally {
        setIsSendingChat(false);
        // Fallback safety to ensure spinner stops even if React state gets batched weirdly
        setTimeout(() => setIsSendingChat(false), 1000);
        setTimeout(() => setIsSendingChat(false), 5000);
      }"""

d = d.replace("""      } catch(err) {
        console.error('Send message error:', err);
      } finally {
        setIsSendingChat(false);
      }""", """      } catch(err) {
        console.error('Send message error:', err);
      } finally {
        setIsSendingChat(false);
        setTimeout(() => setIsSendingChat(false), 3000);
      }""")

with open('frontend/app/dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(d)
