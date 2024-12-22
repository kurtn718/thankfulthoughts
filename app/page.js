import Link from 'next/link';
const HomePage = () => {
  return (
    <div className='hero min-h-screen bg-base-200'>
      <div className='hero-content text-center'>
        <div className='max-w-md'>
          <h1 className='text-6xl font-bold text-primary'>Thankful Thoughts</h1>
          <p className='py-6 text-lg leading-loose'>
            Thankful Thoughts is an AI-powered app that helps you express
            gratitude and improve your mental health.
          </p>
          <Link href='/createthought' className='btn btn-secondary '>
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
