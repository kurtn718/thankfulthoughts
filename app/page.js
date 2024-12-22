import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="hero min-h-[calc(100vh-48px)] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-bold text-primary">
              Thankful Thoughts
            </h1>
            <p className="py-6 text-2xl text-base-content/80">
              Express gratitude effortlessly with AI-powered assistance. Create heartfelt thank you messages that truly convey your appreciation.
            </p>
            <Link href='/createthought' className='btn btn-secondary'>
              Get Started
            </Link>
          </div>
        </div>
      </div>

      <footer className="footer px-10 py-3 bg-base-300 text-base-content border-t">
        <div className="w-full flex justify-between items-center">
          <div className="flex gap-4">
            <Link href="/privacy" className="link link-hover">
              Privacy Policy
            </Link>
          </div>
          <div>
            © 2024 Thankful Thoughts. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
