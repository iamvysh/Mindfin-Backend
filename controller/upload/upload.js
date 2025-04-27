import axios from "axios";
import { uploadFile } from "../../config/s3.js";
import sendResponse from "../../utils/sendResponse.js";

export const upload = async (req, res, next) => {
        const folderName=req.body.folderName
        const data = await uploadFile(req, folderName);

        return sendResponse(res, 200, data);
    
};


// export const downLoadBlob = async (req, res, next) => {
//         try {
//           const { url } = req.query; // ✅ use req.query instead of req.body
      
//           if (!url) return res.status(400).json({ error: 'Missing URL' });
      
//           // ✅ Set responseType to 'arraybuffer' or 'stream'
//           const response = await axios.get(url, { responseType: 'arraybuffer' });
      
//           const contentType = response.headers['content-type'] || 'application/octet-stream';
//           const fileName = url.split('/').pop();
      
//           res.setHeader('Content-Type', contentType);
//           res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
//           sendResponse(res,200,response.data) // ✅ send raw binary
//         } catch (error) {
//           console.error('Download failed:', error);
//           res.status(500).json({ error: 'Failed to fetch blob' });
//         }
//       };


// export const downLoadBlob = async (req, res, next) => {
//         try {
//           const { url } = req.query;
      
          
//           if (!url) return res.status(400).json({ error: 'Missing URL' });
          
//         //   const response = await axios.get(url, { responseType: 'arraybuffer' });

         
      
//         //   const contentType = response.headers['content-type'] || 'application/octet-stream';
//         //   const fileName = url.split('/').pop();
      
//         //   res.setHeader('Content-Type', contentType);
//         //   res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
//         //   res.send(Buffer.from(response.data, 'binary')); 
//         const response = await axios.get(url, { responseType: "stream" });

//         // res.setHeader("Content-Disposition", 'attachment; filename="image.jpg"');
//         res.setHeader("Content-Disposition", 'attachment;"');
//         res.setHeader("Content-Type", response.headers["content-type"]);
    
//         response.data.pipe(res); // Stream the image to the frontend
//         } catch (error) {
//           console.error('Download failed:', error);
//           res.status(500).json({ error: 'Failed to fetch blob' });
//         }
//       };


export const downLoadBlob = async (req, res, next) => {
        try {
          const { url } = req.query;
      
          if (!url) return res.status(400).json({ error: 'Missing URL' });
      
        //   const decodedUrl = decodeURIComponent(url);
          const fileName = url.split('/').pop().split('?')[0];
      
          const response = await axios.get(url, {
            responseType: 'stream', // ← stream to prevent corruption
          });
      
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
      
          // Pipe the stream directly to the response
          response.data.pipe(res);
        } catch (error) {
          console.error('Download failed:', error);
          res.status(500).json({ error: 'Failed to fetch blob' });
        }
      };
      