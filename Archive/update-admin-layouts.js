import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory containing admin pages
const adminDir = path.join(__dirname, 'resources', 'js', 'Pages', 'Admin');

// Function to recursively find all JSX files
function findJsxFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            findJsxFiles(filePath, fileList);
        } else if (file.endsWith('.jsx')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Find all JSX files in the admin directory
const jsxFiles = findJsxFiles(adminDir);

// Update each file
jsxFiles.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace import statement
    content = content.replace(
        /import AuthenticatedLayout from ['"]@\/Layouts\/AuthenticatedLayout['"];/g,
        'import AdminLayout from \'@/Layouts/AdminLayout\';'
    );
    
    // Replace component usage
    content = content.replace(
        /<AuthenticatedLayout(\s+[^>]*>)/g,
        '<AdminLayout$1'
    );
    
    content = content.replace(
        /<\/AuthenticatedLayout>/g,
        '</AdminLayout>'
    );
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log(`Updated: ${filePath}`);
});

console.log('All admin layouts updated successfully!');