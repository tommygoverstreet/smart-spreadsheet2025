# Smart Spreadsheet Dashboard

[![Netlify Status](https://api.netlify.com/api/v1/badges/placeholder/deploy-status)](https://app.netlify.com/sites/placeholder/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Overview

Smart Spreadsheet Dashboard is an advanced, AI-powered data analysis platform that transforms your CSV and JSON files into interactive, insightful dashboards. Built with modern web technologies and featuring a beautiful dark/light theme system.

### ✨ Key Features

- **🎨 Modern UI/UX**: Beautiful 3D card design with smooth animations
- **🌓 Dark/Light Theme**: Intelligent theme toggle with persistent settings
- **📊 Interactive Charts**: Dynamic data visualization with Chart.js
- **🤖 AI Assistant**: Built-in chat for data analysis queries
- **📱 Fully Responsive**: Optimized for all screen sizes
- **⚡ High Performance**: Optimized rendering with caching system
- **🔍 Advanced Search**: Smart filtering and search capabilities
- **📋 Data Validation**: Intelligent data cleaning and validation
- **⌨️ Keyboard Shortcuts**: Power-user keyboard navigation
- **📦 Export Options**: Multiple export formats (CSV, PDF, JSON)

### 🎯 Advanced Functionality

- **Performance Monitoring**: Real-time memory usage and render time tracking
- **Data Caching**: Intelligent caching for improved performance
- **Undo/Redo System**: Complete action history management
- **VLOOKUP Operations**: Advanced data merging capabilities
- **Column Operations**: Add, remove, and manipulate columns
- **Row Management**: Dynamic row insertion and deletion
- **Data Insights**: Automatic statistical analysis
- **Quick Actions**: One-click data optimization tools

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript (ES6+)
- **Data Processing**: PapaParse (CSV), native JSON handling
- **Visualization**: Chart.js for interactive charts
- **PDF Generation**: jsPDF for export functionality
- **Storage**: LocalStorage for persistence
- **PWA**: Progressive Web App capabilities

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smart-spreadsheet-dashboard.git
   cd smart-spreadsheet-dashboard
   ```

2. **Start a local server**
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Using Node.js
   npx serve .
   
   # Using any other static server
   ```

3. **Open in browser**
   ```
   http://localhost:8080
   ```

### Netlify Deployment

1. **Manual Deploy**
   - Drag and drop the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)

2. **Git Deploy**
   - Connect your repository to Netlify
   - Set build directory to `dist`
   - Deploy automatically on push

3. **CLI Deploy**
   ```bash
   npm install -g netlify-cli
   netlify login
   netlify deploy --prod --dir=dist
   ```

## 📁 Project Structure

```
smart-spreadsheet-dashboard/
├── dist/                 # Production-ready files
│   ├── index.html       # Main application file
│   ├── script.js        # Core JavaScript functionality
│   ├── style.css        # Custom styling and 3D effects
│   └── manifest.json    # PWA manifest
├── src/                 # Source files (development)
│   ├── index.html
│   ├── script.js
│   └── style.css
├── README.md           # This file
└── LICENSE            # MIT License
```

## 🎮 Usage Guide

### File Upload
- **Drag & Drop**: Simply drag CSV/JSON files onto the upload area
- **Click to Browse**: Click the upload area to select files
- **Multiple Files**: Upload and manage multiple datasets simultaneously

### Data Analysis
- **Interactive Table**: Sort, filter, and edit data in real-time
- **Chart Generation**: Select numeric columns for automatic visualization
- **AI Chat**: Ask questions about your data using natural language
- **Quick Actions**: Use pre-built analysis tools

### Keyboard Shortcuts
- `Ctrl+F` - Search data
- `Ctrl+Z` - Undo action
- `Ctrl+Y` - Redo action
- `Ctrl+S` - Export CSV
- `Ctrl+O` - Open file dialog
- `?` - Show help modal
- `Tab` - Navigate cells
- `Escape` - Clear search/close modals

### Theme Toggle
- Click the sun/moon icon in the header
- Theme preference is automatically saved
- Smooth transitions between light and dark modes

## 🔧 Configuration

### Customization Options

The application supports various customization options through the Tailwind configuration:

- **Color Scheme**: Modify the color palette in the Tailwind config
- **Fonts**: Inter for body text, JetBrains Mono for code
- **Animations**: Customizable transition timings and effects
- **Responsive Breakpoints**: Tailored for mobile-first design

### Performance Settings

- **Cache Size**: Adjustable data cache limits
- **Page Size**: Configurable table pagination
- **Render Optimization**: Automatic performance monitoring

## 🚀 Deployment

### Prerequisites
- Modern web browser (Chrome 80+, Firefox 75+, Safari 13+)
- No server-side requirements
- All processing happens client-side

### Netlify Configuration

Create a `netlify.toml` file for advanced configuration:

```toml
[build]
  publish = "dist"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Chart.js](https://www.chartjs.org/) for beautiful charts
- [PapaParse](https://www.papaparse.com/) for CSV parsing
- [jsPDF](https://github.com/parallax/jsPDF) for PDF generation

---

**Made with ❤️ for data enthusiasts everywhere**

