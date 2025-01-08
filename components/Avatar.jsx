const Avatar = ({ role }) => {
  // Default avatars for existing roles
  const avatars = {
    user: '👤',
    assistant: '🤖',
    // Add new roles and their image URLs here
    trump: '/avatars/trump.png',
    felix: '/avatars/felix.png',
    kurt: '/avatars/kurt.png',
    lola: '/avatars/lola-llama.png',
    // Add more roles as needed
  };

  // If it's an image URL
  if (avatars[role]?.startsWith('/')) {
    return (
      <img 
        src={avatars[role]} 
        alt={role}
        className="w-12 h-12 object-cover rounded-full" // Doubled from w-6 h-6 to w-12 h-12
      />
    );
  }

  // Return emoji for default roles with larger text size
  return <span className="text-2xl">{avatars[role] || '👤'}</span>; // Added text-2xl for larger emojis
};

export default Avatar; 