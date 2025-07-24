import { createRoot } from 'react-dom/client'
// Import CSS as text for shadow DOM injection
import StoplightStyleSwagger from './page copy'
// class MyComponentElement extends HTMLElement {
//   private root: ShadowRoot
//   constructor() {
//     super()
//     this.root = this.attachShadow({ mode: 'open' })
//   }

//   connectedCallback() {
//     // Create mount point
//     const mountPoint = document.createElement('div')

//     // Inject CSS directly into shadow root
//     const style = document.createElement('style')
//     style.textContent = cssText
//     this.root.appendChild(style)

//     this.root.appendChild(mountPoint)

//     // const apiUrl = this.getAttribute('api-url') || ''
//     const asyncApiUrl = this.getAttribute('async-api-url') || 'http://localhost:3000/docs/asyncApi.json'
//     const swaggerUrl = this.getAttribute('swagger-url') || 'http://localhost:3000/docs/swagger.json'

//     const root = createRoot(mountPoint)
//     root.render(
//             <StoplightStyleSwagger asyncApiUrl={asyncApiUrl} swaggerUrl={swaggerUrl} ></StoplightStyleSwagger>
//     )
//   }
// }

// customElements.define('my-component', MyComponentElement)

const asyncApiUrl = 'http://localhost:3000/docs/asyncApi.json'
const swaggerUrl = 'http://localhost:3000/docs/swagger.json'
const rootElement = document.getElementById('root')
if (rootElement) {
    const root = createRoot(rootElement)
    root.render(
        <StoplightStyleSwagger asyncApiUrl={asyncApiUrl} swaggerUrl={swaggerUrl} />
    )
}
