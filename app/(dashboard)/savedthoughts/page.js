import { FaTools } from 'react-icons/fa';
import { IoCalendarOutline } from 'react-icons/io5';

export default function SavedThoughtsPage() {
  return (
    <div className="min-h-[calc(100vh-6rem)] flex items-center justify-center">
      <div className="text-center p-8 max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <FaTools className="text-6xl text-primary animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold mb-4">
          Coming Soon!
        </h1>
        <p className="text-xl mb-6 text-base-content/80">
        Don't worry!  If you have saved any thoughts we do have them saved.<br/>  
        We're working hard to bring you a beautiful space to store and revisit your thankful thoughts.
        </p>
        <div className="flex items-center justify-center gap-2 text-lg text-primary">
          <IoCalendarOutline className="text-2xl" />
          <span>Estimated launch: January 1st, 2025</span>
        </div>
        <div className="mt-8 p-6 bg-base-200 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">
            What to expect:
          </h2>
          <ul className="text-left space-y-3">
            <li className="flex items-start gap-2">
              <span className="text-primary">✦</span>
              <span>Browse and search through all your saved messages of gratitude</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✦</span>
              <span>Organize thoughts with tags and categories</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✦</span>
              <span>Share your thoughts with others (optional)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">✦</span>
              <span>Get reminders to express gratitude regularly</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}