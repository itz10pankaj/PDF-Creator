const express = require('express');
const app = express();
const pdfRoutes = require('./routes/index.js');

app.use(express.json({ limit: '10mb' }));  // For parsing JSON body with larger size for html content

app.use('/api/pdf', pdfRoutes);

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
