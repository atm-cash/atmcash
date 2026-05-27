import React from 'react';
import { APP_VERSION } from '../version';

function Footer() {
  return (
    <footer className="fixed bottom-2 right-2 text-sm text-gray-500">
      {APP_VERSION}
    </footer>
  );
}

export default Footer;