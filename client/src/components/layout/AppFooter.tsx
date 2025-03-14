export default function AppFooter() {
  return (
    <footer className="bg-white shadow-md mt-6">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-neutral-300 mb-2 md:mb-0">
            VPN Sales Telegram Bot Dashboard © {new Date().getFullYear()}
          </div>
          <div className="flex items-center space-x-4">
            <a href="#" className="text-neutral-300 hover:text-primary text-sm">Documentation</a>
            <a href="#" className="text-neutral-300 hover:text-primary text-sm">Support</a>
            <a href="https://github.com" className="text-neutral-300 hover:text-primary text-sm">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
