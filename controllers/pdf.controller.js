// controllers/pdf.controller.js

const puppeteer = require('puppeteer');
const crypto = require('crypto');
const fse = require('fs-extra');
const path = require('path');

// Dummy uploadFile function (replace with your actual upload logic)
const uploadFile = async (req, filePath, folder) => {
    // Just return some fake response like file path and size
    return [{
        doc_aws_path: `fake_s3_path/${path.basename(filePath)}`,
        doc_path: filePath,
        file_size: (await fse.stat(filePath)).size,
        msg: 'File uploaded successfully'
    }];
};

// Dummy removeDirectory function (replace with your actual cleanup logic)
const removeDirectory = async (folderPath) => {
    try {
        await fse.remove(folderPath);
        console.log(`Removed folder: ${folderPath}`);
    } catch (err) {
        console.error('Error removing folder:', err);
    }
};

// Create PDF from HTML content using Puppeteer

const createPdf= async (templateHtml) => {
        let pdf_name = `${Date.now()}.pdf`;
        let local_pdf_folder = `simple_pdf_folder`;
        let local_pdf_path = `./pdf/${local_pdf_folder}/${pdf_name}`;
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        console.log("Start..........")
        try {
            await page.setContent(templateHtml, {
                waitUntil: ["load", "networkidle0"]
            });
             let pdfOptions = {
                path: local_pdf_path,
                printBackground: true,
                landscape: false,
                scale:0.85
             };

            const boundingBox = await page.$eval('.page', el => {
                const rect = el.getBoundingClientRect();
                return { width: rect.width, height: rect.height };
            });
            console.log('Rendered HTML Dimensions:',boundingBox.width, boundingBox.height );
            pdfOptions.width = `${boundingBox.width}px`;
            // pdfOptions.width = `500px`;
            pdfOptions.height = `${boundingBox.height}px`;
            let pdfResult =await page.pdf(pdfOptions);
            await page.close();
            await browser.close();
            return { status: 200, response: pdfResult };
        } catch (error) {
            await page.close();
            await browser.close();
           // return { status: 400, response: error }
            console.log('error-------',error)

        }
    }

const htmlToPdf = async (req, value) => {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'], timeout: 0 });
    try {
        const min = 999, max = 9999;
        const randomInt = min + crypto.randomInt(max - min);
        let { pdf_html, source } = value;
        value.lead_id = value.lead_id ? value.lead_id : 0;

        const timestamp = Date.now();

        // let lead_id = value.lead_id;
        // let local_pdf_folder = `${source}/${lead_id}-${randomInt}/${timestamp}`;
        // let local_pdf_folder2_delete = `${source}/${lead_id}-${randomInt}`;
        // let uploaded_pdf_folder = `${lead_id || 0}`;

        let local_pdf_folder = `simple_pdf_folder`;
        let uploaded_pdf_folder = `${value.lead_id || 0}`;
        await fse.ensureDir('./pdf/' + local_pdf_folder);
        console.log(`The folder ${local_pdf_folder} has been created!`);

        if (pdf_html) {
            let orientation = 'portrait', format = 'letter';
            let options = { format: format, orientation: orientation, useCustomSize: true };
            let pdf_name = `${Date.now()}.pdf`;
            let local_pdf_path = `./pdf/${local_pdf_folder}/${pdf_name}`;
            let templateHtml = pdf_html;
            console.log("create call");
            let localFileCreate = await createPdf(templateHtml);
            // let localFileCreate = await createPdf(req,options, templateHtml, local_pdf_path, browser);

            let final_response = [];

            if (localFileCreate && localFileCreate.status === 200) {
                final_response = await uploadFile(req, local_pdf_path, uploaded_pdf_folder);
            } else {
                final_response.push({ doc_aws_path: "", doc_path: "", file_size: "", msg: 'Error in PDF creation', error: localFileCreate.response || {} });
            }

            if (final_response) {
                await browser.close();
                setTimeout(() => {
                    // removeDirectory(`./pdf/${local_pdf_folder2_delete}`);
                    console.log("")
                }, 40000);
            }

            return final_response;
        } else {
            await browser.close();
            throw new Error('pdf_html not provided in request body');
        }
    } catch (error) {
        await browser.close();
        throw error;
    }
};

const generateHtmlDocPdf = async (req, res) => {
    try {
        // Basic validation (you can replace with joi or any validator)
        if (!req.body.pdf_html || !req.body.source) {
            return res.status(400).json({ success: false, message: "pdf_html and source are required" });
        }

        const response = await htmlToPdf(req, req.body);
        return res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message || "Something went wrong" });
    }
};

module.exports = {
    generateHtmlDocPdf,
};
