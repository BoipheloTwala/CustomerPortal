//CODE ATTRIBUTION
//01
//React 18+ Concurrent Rendering with createRoot
//Adapted from: Meta Platforms. (2025). createRoot. [online] React Documentation.
//Available at: https://react.dev/reference/react-dom/client/createRoot
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//02
//React StrictMode for Development Checks
//Adapted from: Meta Platforms. (2025). StrictMode. [online] React Documentation.
//Available at: https://react.dev/reference/react/StrictMode
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//03
//ReactDOM Client API
//Adapted from: Meta Platforms. (2025). React DOM APIs. [online] React Documentation.
//Available at: https://react.dev/reference/react-dom
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//04
//TypeScript with React (.tsx files)
//Adapted from: TypeScript. (2025). JSX. [online] TypeScript Documentation.
//Available at: https://www.typescriptlang.org/docs/handbook/jsx.html
//Date Accessed: 10 October 2025

//CODE ATTRIBUTION
//05
//DOM getElementById Method
//Adapted from: MDN Web Docs. (2025). Document.getElementById(). [online] Mozilla Developer Network.
//Available at: https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById
//Date Accessed: 10 October 2025

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
