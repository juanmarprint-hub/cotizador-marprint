export const metadata = {
  title: "Cotizador Marprint",
  description: "Sistema de cotizaciones",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
