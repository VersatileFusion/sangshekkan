declare module '*.jsx' {
  import { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

declare module '@/components/admin/ChallengeParticipantsModal' {
  import { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}

// Global JSX module declarations
declare module '../page.js' {
  const page: any;
  export default page;
}

declare module './page.js' {
  const page: any;
  export default page;
}

// React Router generated type files
declare module '*.js' {
  const module: any;
  export default module;
}
