const bcrypt = require('bcryptjs');
const pool = require('./config/db');
const dotenv = require('dotenv');

dotenv.config();

const seedData = async () => {
    try {
        console.log('🌱 Seeding database...');

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        await pool.query(`
            INSERT IGNORE INTO users (name, email, password, role) VALUES 
            ('Admin User', 'admin@bookscart.com', ?, 'admin')
        `, [hashedPassword]);

        // Create test user
        const userPassword = await bcrypt.hash('user123', salt);
        await pool.query(`
            INSERT IGNORE INTO users (name, email, password, role) VALUES 
            ('John Doe', 'john@example.com', ?, 'user')
        `, [userPassword]);

        // Create sample products
        await pool.query(`
            INSERT IGNORE INTO products (name, description, price, stock, image_url) VALUES 
            ('The Great Gatsby', 'A classic novel by F. Scott Fitzgerald about the American Dream.', 12.99, 50, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
            ('To Kill a Mockingbird', 'Harper Lee''s Pulitzer Prize-winning novel about racial injustice.', 14.99, 35, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'),
            ('1984', 'George Orwell''s dystopian masterpiece about totalitarianism.', 11.99, 40, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'),
            ('Pride and Prejudice', 'Jane Austen''s beloved romance about Elizabeth Bennet.', 9.99, 60, 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400'),
            ('The Catcher in the Rye', 'J.D. Salinger''s coming-of-age classic.', 13.49, 25, 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400'),
            ('Brave New World', 'Aldous Huxley''s vision of a terrifying future society.', 10.99, 30, 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400'),
            ('The Hobbit', 'J.R.R. Tolkien''s adventures of Bilbo Baggins in Middle-earth.', 15.99, 45, 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400'),
            ('Harry Potter and the Sorcerer''s Stone', 'J.K. Rowling''s magical beginning to the Harry Potter series.', 16.99, 100, 'https://images.unsplash.com/photo-1600189261867-30e5ffe7b8da?w=400'),
            ('Lord of the Rings', 'The epic fantasy trilogy by J.R.R. Tolkien.', 24.99, 20, 'https://images.unsplash.com/photo-1506466010722-395aa2bef877?w=400'),
            ('The Alchemist', 'Paulo Coelho''s inspirational tale about following your dreams.', 11.49, 55, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400'),
            ('Sapiens', 'Yuval Noah Harari''s brief history of humankind.', 18.99, 30, 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400'),
            ('Atomic Habits', 'James Clear''s guide to building good habits and breaking bad ones.', 16.49, 70, 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400')
        `);

        console.log('✅ Seed data inserted successfully!');
        console.log('');
        console.log('📋 Test Credentials:');
        console.log('   Admin: admin@bookscart.com / admin123');
        console.log('   User:  john@example.com / user123');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedData();
