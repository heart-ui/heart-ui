import { createGallery } from './gallery'
import './style.css'

createGallery(location.pathname, location.search).mount('#app')
