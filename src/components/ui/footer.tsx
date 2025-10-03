export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full text-center text-sm text-gray-600" style={{ paddingTop: '64px', paddingBottom: '24px' }}>
      <p>
        © {currentYear} SkillSync, Powered by Bisk Amplified. All rights reserved.{' '}
        <a 
          href="https://biskamplified.com/privacy-policy" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-gray-900 underline"
        >
          Privacy Policy
        </a>
        {' | '}
        <a 
          href="https://biskamplified.com/terms-of-service" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:text-gray-900 underline"
        >
          Terms and Conditions
        </a>
      </p>
    </footer>
  );
}
