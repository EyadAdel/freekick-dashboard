import { useState, useEffect } from "react";

const useTranslation = (text, targetLang = 'ar') => {
    const [translatedText, setTranslatedText] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // 1. If text is empty, reset
        if (!text || !text.trim()) {
            setTranslatedText("");
            return;
        }

        // 2. Debounce (wait 500ms)
        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                // Determine pair based on target (e.g., 'en|ar' or 'ar|en')
                const sourceLang = targetLang === 'ar' ? 'en' : 'ar';
                const langPair = `${sourceLang}|${targetLang}`;

                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
                const response = await fetch(url);
                const data = await response.json();

                if (data.responseStatus === 200) {
                    setTranslatedText(data.responseData.translatedText);
                }
            } catch (err) {
                console.error("Translation Error:", err);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [text, targetLang]);

    return { translatedText, loading };
};

export default useTranslation;