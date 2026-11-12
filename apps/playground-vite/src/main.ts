import { createGallery } from './gallery'
import './style.css'

createGallery(location.pathname).mount('#app')
