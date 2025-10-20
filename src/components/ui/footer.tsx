export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-center text-sm text-gray-600" style={{ paddingTop: '64px', paddingBottom: '24px' }}>
      <p>
        © {currentYear} SkillSync, Powered by Bisk Amplified. All rights reserved.{' '}
        <a 
          href="/legal/terms" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-gray-900 underline"
        >
          Terms of Use
        </a>
        {' | '}
        <a 
          href="/legal/user-agreement" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-gray-900 underline"
        >
          User Agreement
        </a>
        {' | '}
        <a 
          href="/legal/privacy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-gray-900 underline"
        >
          Privacy Policy
        </a>
      </p>
    </footer>
  );
}
