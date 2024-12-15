import Link from 'next/link';

const links = [
  {
    name: 'chat',
    href: '/chat',
  }, 
  {
    name: 'profile',
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
