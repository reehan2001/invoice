import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
const storage = getStorage(app);

const Analysis = () => {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [customerData, setCustomerData] = useState([]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'analysis'));
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          fileName: doc.data().fileName,
        }));
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleRemoveDocument = async (documentId) => {
    try {
      // Remove the document from Firebase Storage
      const storageRef = ref(storage, `analysis/${documentId}`);
      await deleteDoc(doc(firestore, 'analysis', documentId));
      await deleteObject(storageRef);
  
      // Update the list of documents
      setDocuments((prevDocuments) =>
        prevDocuments.filter((doc) => doc.id !== documentId)
      );
    } catch (error) {
      console.error('Error removing document:', error);
    }
  };
  

  const handleStartAnalysis = () => {
    const processData = () => {
      const combinedData = {};

      for (const document of customerData) {
        const { CustomerName, POAmount, ActualExpenses, NetAmount } = document;
        if (combinedData[CustomerName]) {
          combinedData[CustomerName].POAmount += POAmount;
          combinedData[CustomerName].ActualExpenses += ActualExpenses;
          combinedData[CustomerName].NetAmount += NetAmount;
        } else {
          combinedData[CustomerName] = {
            POAmount,
            ActualExpenses,
            NetAmount,
          };
        }
      }

      const result = Object.entries(combinedData).map(([CustomerName, data]) => ({
        CustomerName,
        POAmount: data.POAmount,
        ActualExpenses: data.ActualExpenses,
        NetAmount: data.NetAmount,
      }));

      return result;
    };

    const analyzeData = () => {
      const processedData = processData();
      setCustomerData(processedData);
    };

    analyzeData();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      console.error('No file selected.');
      return;
    }

    try {
      // Upload the file to Firebase Storage
      const storageRef = ref(storage, `analysis/${file.name}`);
      await uploadBytes(storageRef, file);

      // Save the file information in the "analysis" collection
      const analysisData = {
        fileName: file.name,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(firestore, 'analysis'), analysisData);
      console.log('File uploaded and document created with ID:', docRef.id);

      setFile(null);
      setDocuments((prevDocuments) => [
        ...prevDocuments,
        { id: docRef.id, fileName: file.name },
      ]);
      router.push('/analysis');
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const readExcelFile = async (file) => {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        resolve(jsonData);
      };

      reader.onerror = (e) => {
        reject(e);
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleProcessDocument = async (document) => {
    try {
      const storageRef = ref(storage, `analysis/${document.fileName}`);
      const downloadUrl = await getDownloadURL(storageRef);
      const response = await fetch(downloadUrl);
      const fileData = await response.arrayBuffer();
      const jsonData = await readExcelFile(fileData);

      const processedData = jsonData.map((row) => ({
        CustomerName: row[0] || '',
        Date: row[1] || '',
        POAmount: parseFloat(row[2] || 0),
        ActualExpenses: parseFloat(row[3] || 0),
        NetAmount: parseFloat(row[4] || 0),
      }));

      setCustomerData((prevData) => [...prevData, ...processedData]);
    } catch (error) {
      console.error('Error processing document:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".xls,.xlsx,.csv" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
      <ul>
        {documents.map((document) => (
          <li key={document.id}>
            {document.fileName}
            <button onClick={() => handleRemoveDocument(document.id)}>Remove</button>
            <button onClick={() => handleProcessDocument(document)}>Process</button>
          </li>
        ))}
      </ul>
      <button onClick={handleStartAnalysis}>Start the Analysis</button>
      {customerData.length > 0 && (
        <div>
          <h2>Analysis Results:</h2>
          <table>
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>P.O. Amount</th>
                <th>Actual Expenses</th>
                <th>Net Amount</th>
              </tr>
            </thead>
            <tbody>
              {customerData.map((data) => (
                <tr key={data.CustomerName}>
                  <td>{data.CustomerName}</td>
                  <td>{data.POAmount}</td>
                  <td>{data.ActualExpenses}</td>
                  <td>{data.NetAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Analysis;


