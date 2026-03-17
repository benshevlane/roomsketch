import { useEffect } from "react";

interface DocumentMeta {
  title: string;
  description: string;
}

export function useDocumentMeta({ title, description }: DocumentMeta) {
  useEffect(() => {
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content") ?? "";

    document.title = title;
    metaDesc?.setAttribute("content", description);

    return () => {
      document.title = prevTitle;
      metaDesc?.setAttribute("content", prevDesc);
    };
  }, [title, description]);
}
