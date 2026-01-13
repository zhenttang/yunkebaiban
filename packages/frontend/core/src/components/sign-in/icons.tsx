import React from 'react';

export const MobileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M7 2H17C18.1046 2 19 2.89543 19 4V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V4C5 2.89543 5.89543 2 7 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 18H12.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const WeChatIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M17.5 14.5C17.5 14.5 19 15.5 19 17C19 18.5 17.5 19.5 17.5 19.5L17 21.5L15 20.5C15 20.5 14 21 12.5 21C10 21 8 19 8 16.5C8 14 10 12 12.5 12C15 12 17.5 13 17.5 14.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.5 8.5C13.5 8.5 15 9.5 15 11C15 12.5 13.5 13.5 13.5 13.5L13 15.5L11 14.5C11 14.5 10 15 8.5 15C6 15 4 13 4 10.5C4 8 6 6 8.5 6C11 6 13.5 7 13.5 8.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7.5" cy="9.5" r="0.5" fill="currentColor" />
    <circle cx="10.5" cy="9.5" r="0.5" fill="currentColor" />
    <circle cx="11.5" cy="15.5" r="0.5" fill="currentColor" />
    <circle cx="14.5" cy="15.5" r="0.5" fill="currentColor" />
  </svg>
);
export const EmptyStateIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M60 110C87.6142 110 110 87.6142 110 60C110 32.3858 87.6142 10 60 10C32.3858 10 10 32.3858 10 60C10 87.6142 32.3858 110 60 110Z"
      fill="#F4F5F7"
    />
    <path
      d="M40 45H80M40 60H80M40 75H60"
      stroke="#9BA0A8"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M75 35V85M45 85H75"
      stroke="#9BA0A8"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.5"
    />
  </svg>
);