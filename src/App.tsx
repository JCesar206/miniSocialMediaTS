import React, { useEffect, useRef, useState } from "react";
import "./App.css";

type Post = {
  id: string;
  imageDataUrl?: string; // base64 local image
  title: string;
  comment: string;
  createdAt: number;
};

const STORAGE_KEY = "mini-social.posts.v1";
const THEME_KEY = "mini-social.theme.v1";

const EMOJIS = ["😀", "😂", "😍", "😢", "😮", "🔥", "👍", "❤️", "🎉", "🤔"];

export default function App() {
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Post[]) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  });

  const [editingId, setEditingId] = useState<string | null>(null);

  // form state
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);

  const commentRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const t = localStorage.getItem(THEME_KEY) as "light" | "dark" | null;
    return t ?? "light";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [theme]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  function clearForm(returnFocus = true) {
    setTitle("");
    setComment("");
    setImageFile(null);
    setImagePreview(undefined);
    setEditingId(null);
    if (fileRef.current) fileRef.current.value = "";
    if (returnFocus && commentRef.current) commentRef.current.focus();
  }

  function handleAddOrUpdate() {
    const trimmedComment = comment.trim();
    const trimmedTitle = title.trim() || "Sin título";
    if (!trimmedComment && !imagePreview) {
      // nothing to add
      if (commentRef.current) commentRef.current.focus();
      return;
    }

    if (editingId) {
      // update existing post
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? { ...p, title: trimmedTitle, comment: trimmedComment, imageDataUrl: imagePreview }
            : p
        )
      );
      clearForm();
      return;
    }

    const newPost: Post = {
      id: cryptoRandomId(),
      title: trimmedTitle,
      comment: trimmedComment,
      imageDataUrl: imagePreview,
      createdAt: Date.now(),
    };
    setPosts((p) => [newPost, ...p]);
    clearForm();
  }

  function startEdit(postId: string) {
    const p = posts.find((x) => x.id === postId);
    if (!p) return;
    setEditingId(p.id);
    setTitle(p.title);
    setComment(p.comment);
    setImagePreview(p.imageDataUrl);
    if (commentRef.current) commentRef.current.focus();
  }

  function removePost(postId: string) {
    if (!confirm("¿Eliminar esta publicación?")) return;
    setPosts((p) => p.filter((x) => x.id !== postId));
  }

  function handleEmojiClick(e: string) {
    setComment((c) => c + e);
    if (commentRef.current) commentRef.current.focus();
  }

  function handleFileChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0] ?? null;
    setImageFile(f);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl mx-auto">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Mini Red Social</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-300 font-semibold">Tema</span>
              <button
                onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
                className="px-3 py-1 rounded-lg bg-gray-300 hover:bg-gray-500 dark:border-gray-700 cursor-pointer"
              >
                {theme === "light" ? "🌞" : "🌙"}
              </button>
            </div>
          </header>

          <main className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <section className="mb-6">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200 ">Título de la imagen</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border p-2 mb-3 bg-gray-50 font-semibold dark:bg-gray-700 dark:text-white border-gray-200 dark:border-gray-600 focus:outline-none"
                placeholder="Pon un título (opcional)"
              />

              <label className="block text-sm mb-1 text-gray-700 dark:text-gray-200 font-semibold">Comentario</label>
              <textarea
                ref={commentRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full rounded-md border p-2 mb-3 bg-gray-50 font-semibold dark:bg-gray-700 border-gray-200 dark:text-white dark:border-gray-600 focus:outline-none resize-none"
                placeholder="Escribe algo sobre la imagen..."
              />

              <div className="flex items-center gap-3 mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <div className="px-3 py-1 rounded bg-gray-200 font-semibold hover:bg-gray-500 hover:text-white dark:bg-gray-700 dark:text-white text-sm">📁 Seleccionar imagen</div>
                </label>

                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(undefined);
                    if (fileRef.current) fileRef.current.value = "";
                    if (commentRef.current) commentRef.current.focus();
                  }}
                  className="px-3 py-1 rounded bg-gray-200 font-semibold hover:bg-gray-500 hover:text-white dark:bg-gray-700 dark:text-white text-sm cursor-pointer"
                >
                  🧹 Limpiar imagen
                </button>

                <button
                  onClick={() => clearForm()}
                  className="ml-auto px-3 py-1 bg-gray-200 font-semibold hover:bg-gray-500 hover:text-white rounded text-sm dark:bg-gray-700 dark:text-white cursor-pointer"
                >
                  Limpiar campos
                </button>

                <button
                  onClick={handleAddOrUpdate}
                  className="px-4 py-1 rounded bg-blue-600 text-white text-sm font-semibold hover:bg-blue-900 hover:opacity-90 cursor-pointer"
                >
                  {editingId ? "Actualizar" : "Agregar"}
                </button>
              </div>

              {imagePreview && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Previsualización</div>
                  <img src={imagePreview} alt="preview" className="max-h-40 rounded-lg object-contain" />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => handleEmojiClick(e)}
                    className="px-2 py-1 bg-gray-300 hover:bg-gray-500 rounded text-sm cursor-pointer"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg mb-4 text-gray-800 dark:text-gray-100 font-semibold">Publicaciones</h2>

              {posts.length === 0 && (
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">No hay publicaciones. Crea la primera.</div>
              )}

              <div className="grid gap-4">
                {posts.map((p) => (
                  <article key={p.id} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{p.title}</div>
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{new Date(p.createdAt).toLocaleString()}</div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{p.comment}</p>
                        {p.imageDataUrl && (
                          <div className="mt-3">
                            <img src={p.imageDataUrl} alt={p.title} className="max-h-60 w-full object-contain rounded" />
                          </div>
                        )}

                        <div className="mt-3 flex gap-2">
                          <button onClick={() => startEdit(p.id)} className="px-3 py-1 rounded bg-yellow-400 text-white hover:bg-yellow-600 text-sm font-semibold cursor-pointer">Editar</button>
                          <button onClick={() => removePost(p.id)} className="px-3 py-1 rounded  bg-red-400 text-white hover:bg-red-600 text-sm font-semibold cursor-pointer">Eliminar</button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </main>

          <Footer />
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-6">
      <div className="w-full max-w-3xl mx-auto py-6 flex items-center justify-center">
        <div className="text-center text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center justify-center gap-4 mb-2">
            <a href="https://jcesar206.github.io/myPersonalBlog/" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-purple-600">Home Page</a>
            <a href="https://github.com/JCesar206" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-purple-700">Github</a>
            <a href="https://www.linkedin.com/in/jcesar206" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-purple-700">LinkedIn</a>
            <a href="mailto:jcesar206@hotmail.com" className="underline font-semibold hover:text-purple-700">Hotmail</a>
            <a href="mailto:jcesary06@gmail.com" className="underline font-semibold hover:text-purple-700">Gmail</a>
          </div>
          <div>© {new Date().getFullYear()} Mini Social Media | Juls | All right reserved.</div>
        </div>
      </div>
    </footer>
  );
}

// small helper
function cryptoRandomId(length = 10) {
  return Array.from(crypto.getRandomValues(new Uint8Array(length))).map((b) => (b % 36).toString(36)).join("");
}