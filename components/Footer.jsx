import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer px-10 py-3 bg-base-300 text-base-content border-t">
      <div className="w-full flex justify-between items-center">
        <div className="flex gap-4">
          <Link href="/privacy" className="link link-hover">
            Privacy Policy
          </Link>
          <Link href="/terms" className="link link-hover">
            Terms of Use
          </Link>
        </div>
        <div>
          © 2024 Thankful Thoughts. All rights reserved.
        </div>
      </div>
    </footer>
  );
} 