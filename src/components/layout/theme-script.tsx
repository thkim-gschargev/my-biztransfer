// 라이트 우선: 저장된 선택이 있으면 따르고, 없으면 라이트로 시작한다.
const THEME_INIT_SCRIPT = `(() => {
  try {
    const stored = localStorage.getItem("bt-theme");
    if (stored === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();`;

export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
      suppressHydrationWarning
    />
  );
}
