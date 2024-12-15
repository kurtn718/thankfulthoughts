import Link from 'next/link';

const links = [
  {
    name: 'Chat',
    href: '/chat',
  }, 
  {
    name: 'Profile',
    href: '/profile',
  },
];

const NavLinks = () => {
  return (
    <ul className='menu text-base-content'>
      {links.map((link) => (
        <li key={link.name}>
          <Link href={link.href}>{link.name}</Link>
        </li>
      ))}
    </ul>
  );
};

export default NavLinks;
