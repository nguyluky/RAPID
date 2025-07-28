import { createRoot } from 'react-dom/client'
// Import CSS as text for shadow DOM injection
import cssText from './index.css?inline'
import StoplightStyleSwagger from "./StoplightStyleSwagger";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";

if (!import.meta.env.DEV) {
    class MyComponentElement extends HTMLElement {
        private root: ShadowRoot
        constructor() {
            super()
            this.root = this.attachShadow({ mode: 'open' })
        }
        connectedCallback() {
            // Create mount point
            const mountPoint = document.createElement('div')
            // Inject CSS directly into shadow root
            const style = document.createElement('style')
            style.textContent = cssText
            this.root.appendChild(style)
            this.root.appendChild(mountPoint)
            // const apiUrl = this.getAttribute('api-url') || ''
            const asyncApiUrl = this.getAttribute('async-api-url') || 'http://localhost:3000/docs/asyncApi.json'
            const swaggerUrl = this.getAttribute('swagger-url') || 'http://localhost:3000/docs/swagger.json'
            const root = createRoot(mountPoint)
            root.render(
                <Theme>
                    <StoplightStyleSwagger asyncApiUrl={asyncApiUrl} swaggerUrl={swaggerUrl} ></StoplightStyleSwagger>
                </Theme>
            )
        }
    }
    customElements.define('my-component', MyComponentElement)

} else {
    const asyncApiUrl = 'http://localhost:3000/docs/asyncApi.json'
    const swaggerUrl = 'http://localhost:3000/docs/swagger.json'
    const rootElement = document.getElementById('root')
    if (rootElement) {
        const root = createRoot(rootElement)
        root.render(
            <Theme>
                <StoplightStyleSwagger asyncApiUrl={asyncApiUrl} swaggerUrl={swaggerUrl} />
            </Theme>
        )
    }
}

