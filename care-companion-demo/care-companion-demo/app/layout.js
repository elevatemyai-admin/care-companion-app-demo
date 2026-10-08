export const metadata = {
  title: "Care Companion (Demo)",
  description: "A demo of Care Companion using sample data.",
  robots: { index: false, follow: false }
};

export const viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh" }}>{children}</body>
    </html>
  );
}
