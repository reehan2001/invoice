import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { initializeApp } from 'firebase/app';
import axios from 'axios';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc , updateDoc, deleteDoc } from 'firebase/firestore';
import {
  TextField,
  Container,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Button,
} from "@mui/material";

import Box from '@mui/material/Box';

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

const customerOptions = [
  "Brakes India Private",
  "Limited Wheels India",
  "Tempel Precision Metal Products",
  "Mahindra And Mahindra",
  "Bagadia Industrial Fasteners",
  "Sai Kanthadesh",
  "Pressmatic Engineering india pvt",
  "Others",
];

const labourWorksOptions = [
  "Shaping",
  "Turning",
  "S.Grinding",
  "Jig Boring",
  "Tapping",
  "VMC",
  "CNC Lathe",
  "Wire Cutting",
  "Sparking",
  "Hardening",
  "Jig Grinding",
  "Polishing",
  "Milling",
  "Welding",
  "Bending",
  "Shearing",
  "Cylinder-Grinding",
  "Engraving",
  "Blacking",
  "Powder Coating",
];

const supplyOptions = ["Sivagamy", "Chennai alloy", "Goel Steel", "Misumi", "Excel Trading", "Eshan", "Bohler", " Sainath" ,
"National traders","Others"];

const IndexPage = () => {

  const router = useRouter();
  const [formId, setFormId] = useState(null);
  const [docRef, setDocRef] = useState(null);
  const [formData, setFormData] = useState({});
  const [customerName, setCustomerName] = useState("");
  const [otherCustomerName, setOtherCustomerName] = useState("");
  const [purchaseNo, setPurchaseNo] = useState("");
  const [date, setDate] = useState("");
  const [poAmount, setPoAmount] = useState("");
  const [supplyData, setSupplyData] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [labourWorksData, setLabourWorksData] = useState([]);
  const [labourWorksTotalCost, setLabourWorksTotalCost] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");


  useEffect(() => {
    const fetchFormData = async () => {
      const formId = router.query.formId;
      if (formId) {
        try {
          const formDocRef = doc(firestore, 'forms', formId);
          const formDocSnapshot = await getDoc(formDocRef);
          if (formDocSnapshot.exists()) {
            const formData = formDocSnapshot.data();
            setFormData(formData);
            setCustomerName(formData.customerName);
            setPurchaseNo(formData.purchaseNo);
            setDate(formData.date);
            setPoAmount(formData.poAmount);
            if (formData.customerName === "Others") {
              setOtherCustomerName(formData.otherCustomerName || "");
            } else {
              setOtherCustomerName("");
            }
            setSupplyData(formData.supplyData || []);
            setTotalAmount(formData.totalAmount || 0);
            setLabourWorksData(formData.labourWorksData || []);
            setLabourWorksTotalCost(formData.labourWorksTotalCost || 0);
          }
        } catch (error) {
          console.error('Error retrieving form data:', error);
        }
      }
    };

    fetchFormData();
    if (router.query.customerName) {
      setCustomerName(decodeURIComponent(router.query.customerName));
    }
  }, [router.query.formId]);


  const handleCustomerNameChange = (e) => {
    const selectedCustomerName = e.target.value;
    setCustomerName(selectedCustomerName);
    if (selectedCustomerName !== "Others") {
      setOtherCustomerName(""); // Clear otherCustomerName if selected customer is not "Others"
    }
  };

  const handleOtherCustomerNameChange = (e) => {
    setOtherCustomerName(e.target.value);
  };

  const handlePurchaseNoChange = (e) => {
    setPurchaseNo(e.target.value);
  };

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handlePoAmountChange = (e) => {
    setPoAmount(e.target.value);
  };
 
  const handleSupplyNameChange = (index, e) => {
    const updatedSupplyData = [...supplyData];
    const selectedSupplyName = e.target.value;
    updatedSupplyData[index].supplyName = selectedSupplyName;
    if (selectedSupplyName === "Others") {
      updatedSupplyData[index].otherSupplyName = "";
    }
    setSupplyData(updatedSupplyData);
    calculateTotalAmount(updatedSupplyData);
  };

  const handleOtherSupplyNameChange = (index, e) => {
    const updatedSupplyData = [...supplyData];
    updatedSupplyData[index].otherSupplyName = e.target.value;
    setSupplyData(updatedSupplyData);
  };

  const handleInvoiceNoChange = (index, e) => {
    const updatedSupplyData = [...supplyData];
    updatedSupplyData[index].invoiceNo = e.target.value;
    setSupplyData(updatedSupplyData);
  };

  const handleRemoveSupplyData = (index) => {
    const updatedSupplyData = [...supplyData];
    updatedSupplyData.splice(index, 1);
    setSupplyData(updatedSupplyData);
    calculateTotalAmount(updatedSupplyData);
  };

  const handleSupplyDateChange = (index, e) => {
    const updatedSupplyData = [...supplyData];
    updatedSupplyData[index].date = e.target.value;
    setSupplyData(updatedSupplyData);
  };
  ///////
  const handleAmountChange = (index, e) => {
    const updatedSupplyData = [...supplyData];
    updatedSupplyData[index].amount = e.target.value;
    setSupplyData(updatedSupplyData);
    calculateTotalAmount(updatedSupplyData);
  };

  const handleAddSupplyData = () => {
    setSupplyData((prevData) => [
      ...prevData,
      {
        supplyName: "",
        otherSupplyName: "",
        invoiceNo: "",
        date: "",
        amount: "",
      },
    ]);
  };

  const calculateTotalAmount = (data) => {
    const total = data.reduce((acc, item) => {
      const amount = parseFloat(item.amount);
      const calculatedAmount = isNaN(amount) ? 0 : (amount * 18) / 100; // Modify the calculation here
      return acc + calculatedAmount;
    }, 0);
    setTotalAmount(total);
  };

  const handleLabourWorksOptionChange = (index, e) => {
    const updatedLabourWorksData = [...labourWorksData];
    const selectedOption = e.target.value;
    updatedLabourWorksData[index].option = selectedOption;
    if (selectedOption === "Not-Used") {
      updatedLabourWorksData[index].supplierName = "Not-Used";
      updatedLabourWorksData[index].ourDC = "";
      updatedLabourWorksData[index].subDC = "";
      updatedLabourWorksData[index].amount = "";
      updatedLabourWorksData[index].gstNo = "";
    }
    setLabourWorksData(updatedLabourWorksData);
    calculateLabourWorksTotalCost(updatedLabourWorksData);
  };

  const handleSupplierNameChange = (index, e) => {
    const updatedLabourWorksData = [...labourWorksData];
    updatedLabourWorksData[index].supplierName = e.target.value;
    setLabourWorksData(updatedLabourWorksData);
  };

  const handleOurDCChange = (index, e) => {
    const updatedLabourWorksData = [...labourWorksData];
    updatedLabourWorksData[index].ourDC = e.target.value;
    setLabourWorksData(updatedLabourWorksData);
  };

  const handleSubDCChange = (index, e) => {
    const updatedLabourWorksData = [...labourWorksData];
    updatedLabourWorksData[index].subDC = e.target.value;
    setLabourWorksData(updatedLabourWorksData);
  };

  const handleLabourWorksAmountChange = (index, e) => {
    const updatedLabourWorksData = [...labourWorksData];
    updatedLabourWorksData[index].amount = e.target.value;
    setLabourWorksData(updatedLabourWorksData);
    calculateLabourWorksTotalCost(updatedLabourWorksData);
  };

  const handleGSTNoChange = (index, e) => {
    const updatedLabourWorksData = [...labourWorksData];
    updatedLabourWorksData[index].gstNo = e.target.value;
    setLabourWorksData(updatedLabourWorksData);
    calculateLabourWorksTotalCost(updatedLabourWorksData);
  };

  const calculateLabourWorksTotalCost = (data) => {
    const totalCost = data.reduce((acc, item) => {
      const amount = parseFloat(item.amount);
      const gstNo = parseFloat(item.gstNo);
      const subTotal = isNaN(amount)
        ? 0
        : amount * (isNaN(gstNo) ? 1 : gstNo / 100);
      return acc + subTotal;
    }, 0);
    setLabourWorksTotalCost(totalCost);
  };

  const handleAddLabourWorksData = () => {
    setLabourWorksData((prevData) => [
      ...prevData,
      {
        option: "",
        supplierName: "",
        ourDC: "",
        subDC: "",
        amount: "",
        gstNo: "12",
      },
    ]);
  };

  const handleRemoveLabourWorksData = (index) => {
    const updatedLabourWorksData = [...labourWorksData];
    updatedLabourWorksData.splice(index, 1);
    setLabourWorksData(updatedLabourWorksData);
    calculateLabourWorksTotalCost(updatedLabourWorksData);
  };

  const rawMaterialTotalAmount = totalAmount;
  const labourTotalAmount = labourWorksTotalCost;
  const actualExpenses = rawMaterialTotalAmount + labourTotalAmount;
  const netAmount = parseFloat(poAmount) - actualExpenses;




  const handleFormSubmit = async (e) => {
    e.preventDefault();
  
    try {
      if (
        customerName &&
        purchaseNo &&
        date &&
        poAmount &&
        supplyData.length > 0 &&
        totalAmount > 0 &&
        labourWorksData.length > 0 &&
        labourTotalAmount > 0
      ) {
        const customerNameToSubmit =
          customerName === "Others" ? otherCustomerName : customerName;
  
        if (formId) {
          // Update the existing document in the "forms" collection
          const formDocRef = doc(firestore, 'forms', formId);
          await updateDoc(formDocRef, {
            ...formData, // <-- Corrected line
            purchaseNo,
            date,
            poAmount,
            supplyData,
            totalAmount,
            labourWorksData,
            labourWorksTotalCost,
            customerName: customerNameToSubmit,
            timestamp: serverTimestamp(),
          });
          console.log('Document updated with ID:', formId);
        } else {
          // Create a new document in the "forms" collection
          const newDocRef = await addDoc(collection(firestore, 'forms'), {
            ...formData, // <-- Corrected line
            purchaseNo,
            date,
            poAmount,
            supplyData,
            totalAmount,
            labourWorksData,
            labourWorksTotalCost,
            customerName: customerNameToSubmit,
            timestamp: serverTimestamp(),
          });
          console.log('Document created with ID:', newDocRef.id);
          setFormId(newDocRef.id);
        }
  
        setFormData({});
        setCustomerName("");
        setOtherCustomerName("");
        setPurchaseNo("");
        setDate("");
        setPoAmount("");
        setSupplyData([]);
        setTotalAmount(0);
        setLabourWorksData([]);
        setLabourWorksTotalCost(0);
        router.push(`/form`);
      } else {
        alert("Please fill in all the fields.");
      }
    } catch (error) {
      console.error("Error adding/updating document: ", error);
    }
  };

  const handleIncompleteSubmit = async (e) => {
    e.preventDefault();
    try {
      if (customerName && purchaseNo) {
        const customerNameToSubmit =
          customerName === "Others" ? otherCustomerName : customerName;
  
        if (formId) {
          // Update the existing document in the "forms" collection
          const formDocRef = doc(firestore, 'forms', formId);
          await updateDoc(formDocRef, {
            ...formData,
            purchaseNo,
            date,
            poAmount,
            supplyData,
            totalAmount,
            labourWorksData,
            labourWorksTotalCost,
            customerName: customerNameToSubmit,
            timestamp: serverTimestamp(),
          });
          console.log('Document updated with ID:', formId);
          
        } else {
          // Create a new document in the "forms" collection
          const newDocRef = await addDoc(collection(firestore, 'forms'), {
            ...formData,
            purchaseNo,
            date,
            poAmount,
            supplyData,
            totalAmount,
            labourWorksData,
            labourWorksTotalCost,
            customerName: customerNameToSubmit,
            timestamp: serverTimestamp(),
          });
          console.log('Document created with ID:', newDocRef.id);

          setFormId(newDocRef.id);
         
          // Delete the previous document created by the user
          if (previousFormId) {
            const previousFormDocRef = doc(firestore, 'forms', previousFormId);
            await deleteDoc(previousFormDocRef);
            console.log('Previous document deleted with ID:', previousFormId);
          }
        }
  
        setFormData({});
        setCustomerName("");
        setOtherCustomerName("");
        setPurchaseNo("");
        setDate("");
        setPoAmount("");
        setSupplyData([]);
        setTotalAmount(0);
        setLabourWorksData([]);
        setLabourWorksTotalCost(0);
        router.push(`/form`);
      } else {
        alert("Please fill in all the fields.");
      }
    } catch (error) {
      console.error("Error adding/updating document: ", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("/api/createExcelSheet", {
        customerName:
          customerName === "Others" ? otherCustomerName : customerName,
        purchaseNo,
        date,
        poAmount,
        supplyData,
        totalAmount,
        labourWorksData,
        labourWorksTotalCost,
      });

      console.log(response.data); // Handle the response from the server
      handleDownloadExcel(response.data.downloadUrl);
      // Reset the form
      setCustomerName("");
      setPurchaseNo("");
      setDate("");
      setPoAmount("");
      setOtherCustomerName("");
      setSupplyData([]);
      setTotalAmount(0);
      setLabourWorksData([]);
      setLabourWorksTotalCost(0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDownloadExcel = (downloadUrl) => {
    const fileName = `${customerName}_${purchaseNo}.xlsx`;
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileName;
    link.click();
  };
  
const handleAnalysisClick = () =>{
  router.push('/analysis');
}
  
  
  return (
    <Container>
       <Typography variant="h3">1. Customer-Name</Typography>
       <form>
      <label>
          <p>Customer Name</p>
          <FormControl sx={{ width: 300, py: 2 }}>
            <InputLabel id="demo-simple-select-label"></InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={customerName}
              onChange={handleCustomerNameChange}
            >
              {customerOptions.map((option, index) => (
                <MenuItem key={index} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </label>
        {customerName === "Others" && (
          <label>
            <p>Enter Customer Name</p>
            <Box
              component="form"
              sx={{ width: 400, maxWidth: "100%" }}
              noValidate
              autoComplete="off"
            >
              <TextField
                fullWidth
                label=""
                id="fullWidth"
                value={otherCustomerName}
                onChange={handleOtherCustomerNameChange}
              />
            </Box>
          </label>
        )}
        <label>
          <p>Purchase No</p>
          <Box
            component="form"
            sx={{ width: 400, maxWidth: "100%" }}
            noValidate
            autoComplete="off"
          >
            <TextField
              fullWidth
              label=""
              id="fullWidth"
              value={purchaseNo}
              onChange={handlePurchaseNoChange}
            />
          </Box>
        </label>
        <label>
          <p>Date</p>
          <Box
            component="form"
            sx={{ width: 400, maxWidth: "100%" }}
            noValidate
            autoComplete="off"
          >
            <TextField
              fullWidth
              label=""
              id="fullWidth"
              type="date"
              value={date}
              onChange={handleDateChange}
            />
          </Box>
        </label>
        <label>
        <p>P.O. Amount</p>
          <Box
            component="form"
            sx={{ width: 400, maxWidth: "100%" }}
            noValidate
            autoComplete="off"
          >
            <TextField
              fullWidth
              label=""
              id="fullWidth"
              type="number"
              value={poAmount}
              onChange={handlePoAmountChange}
            />
          </Box>
        </label>
        <Typography variant="h3">2. Purchase</Typography>
        {supplyData.map((item, index) => (
          <div key={index}>
            <Typography variant="h4">Supply {index + 1}</Typography>
            <div>
              <p>Supply Name</p>
              <FormControl sx={{ width: 300, py: 2 }}>
                <InputLabel id="demo-simple-select-label"></InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={item.supplyName}
                  
                  onChange={(e) => handleSupplyNameChange(index, e)}
                >
                  {supplyOptions.map((option, optionIndex) => (
                    <MenuItem key={optionIndex} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {item.supplyName === "Others" && (
                <Box
                  component="form"
                  sx={{ width: 400, maxWidth: "100%" }}
                  noValidate
                  autoComplete="off"
                >
                  <TextField
                    fullWidth
                    label="Enter the Supplier"
                    id="fullWidth"
                    type="text"
                    value={item.otherSupplyName}
                    onChange={(e) => handleOtherSupplyNameChange(index, e)}
                  />
                </Box>
              )}
            </div>
            <div>
              <p>Invoice No</p>
              <Box
                component="form"
                sx={{ width: 400, maxWidth: "100%" }}
                noValidate
                autoComplete="off"
              >
                <TextField
                  fullWidth
                  label=""
                  id="fullWidth"
                  type="number"
                  value={item.invoiceNo}
                  onChange={(e) => handleInvoiceNoChange(index, e)}
                />
              </Box>
            </div>
            <div>
              <p>Date</p>
              <Box
                component="form"
                sx={{ width: 400, maxWidth: "100%" }}
                noValidate
                autoComplete="off"
              >
                <TextField
                  fullWidth
                  label=""
                  id="fullWidth"
                  type="date"
                  value={item.date}
                  onChange={(e) => handleSupplyDateChange(index, e)}
                />
              </Box>
            </div>
            <div>
              <p>Amount</p>
              <Box
                component="form"
                sx={{ width: 400, maxWidth: "100%" }}
                noValidate
                autoComplete="off"
              >
                <TextField
                  fullWidth
                  label=""
                  id="fullWidth"
                  type="number"
                  value={item.amount}
                  onChange={(e) => handleAmountChange(index, e)}
                />
              </Box>
            </div>
            <Button
              type="button"
              onClick={() => handleRemoveSupplyData(index)}
              sx={{
                display: "inline-block",
                outline: "none",
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
                borderRadius: "500px",
                transitionProperty:
                  "background-color, border-color, color, box-shadow, filter",
                transitionDuration: ".3s",
                border: "1px solid transparent",
                letterSpacing: 2,
                minWidth: 160,
                textTransform: "uppercase",
                whiteSpace: "normal",
                fontWeight: 700,
                textAlign: "center",
                padding: "17px 48px",
                color: "#fff",
                backgroundColor: "#1ED760",
                height: 48,
                m: 4,
                "&:hover": {
                  transform: "scale(1.04)",
                  backgroundColor: "#21e065",
                },
              }}
            >
              Remove Supply
            </Button>
          </div>
        ))}
        <Button
          type="button"
          onClick={handleAddSupplyData}
          sx={{
            display: "inline-block",
            outline: "none",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
            borderRadius: "500px",
            transitionProperty:
              "background-color, border-color, color, box-shadow, filter",
            transitionDuration: ".3s",
            border: "1px solid transparent",
            letterSpacing: 2,
            minWidth: 160,
            textTransform: "uppercase",
            whiteSpace: "normal",
            fontWeight: 700,
            textAlign: "center",
            padding: "17px 48px",
            color: "#fff",
            backgroundColor: "#1ED760",
            height: 48,
            m: 4,
            "&:hover": {
              transform: "scale(1.04)",
              backgroundColor: "#21e065",
            },
          }}
        >
          Add Supply
        </Button>
        <div>
          <Typography variant="h5" sx={{ mb: "1em" }}>
            Total Amount: {totalAmount}
          </Typography>
        </div>
        <Typography variant="h3" sx={{ mb: "0em" }}>
          3. Labour-Works
        </Typography>
        {labourWorksData.map((item, index) => (
          <div key={index}>
            <Typography variant="h4">Labour Work - {index + 1}</Typography>
            <div>
              <p>Select The Work</p>
              <FormControl sx={{ width: 300, py: 2 }}>
                <InputLabel id="demo-simple-select-label"></InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={item.option}
                  onChange={(e) => handleLabourWorksOptionChange(index, e)}
                >
                  {labourWorksOptions.map((option, optionIndex) => (
                    <MenuItem key={optionIndex} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            {item.option !== "Not-Used" && (
              <div>
                <div>
                  <p>Supplier Name</p>
                  <Box
                    component="form"
                    sx={{ width: 400, maxWidth: "100%" }}
                    noValidate
                    autoComplete="off"
                  >
                    <TextField
                      fullWidth
                      label=""
                      id="fullWidth"
                      type="text"
                      value={item.supplierName}
                      onChange={(e) => handleSupplierNameChange(index, e)}
                    />
                  </Box>
                </div>
                <div>
                  <p>Our D.C. No</p>
                  <Box
                    component="form"
                    sx={{ width: 400, maxWidth: "100%" }}
                    noValidate
                    autoComplete="off"
                  >
                    <TextField
                      fullWidth
                      label=""
                      id="fullWidth"
                      type="text"
                      value={item.ourDC}
                      onChange={(e) => handleOurDCChange(index, e)}
                    />
                  </Box>
                </div>
                <div>
                  <p>Sub D.C. No</p>
                  <Box
                    component="form"
                    sx={{ width: 400, maxWidth: "100%" }}
                    noValidate
                    autoComplete="off"
                  >
                    <TextField
                      fullWidth
                      label=""
                      id="fullWidth"
                      type="text"
                      value={item.subDC}
                      onChange={(e) => handleSubDCChange(index, e)}
                    />
                  </Box>
                </div>
                <div>
                  <p>Amount</p>
                  <Box
                    component="form"
                    sx={{ width: 400, maxWidth: "100%" }}
                    noValidate
                    autoComplete="off"
                  >
                    <TextField
                      fullWidth
                      label=""
                      id="fullWidth"
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleLabourWorksAmountChange(index, e)}
                    />
                  </Box>
                </div>
                <div>
                  <p>GST No</p>
                  <Box
                    component="form"
                    sx={{ width: 400, maxWidth: "100%" }}
                    noValidate
                    autoComplete="off"
                  >
                    <TextField
                      fullWidth
                      label=""
                      id="fullWidth"
                      type="number"
                      value={item.gstNo}
                      onChange={(e) => handleGSTNoChange(index, e)}
                    />
                  </Box>
                </div>
                <Button
                  type="button"
                  onClick={() => handleRemoveLabourWorksData(index)}
                  sx={{
                    display: "inline-block",
                    outline: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    lineHeight: 1,
                    borderRadius: "500px",
                    transitionProperty:
                      "background-color, border-color, color, box-shadow, filter",
                    transitionDuration: ".3s",
                    border: "1px solid transparent",
                    letterSpacing: 2,
                    minWidth: 160,
                    textTransform: "uppercase",
                    whiteSpace: "normal",
                    fontWeight: 700,
                    textAlign: "center",
                    padding: "17px 48px",
                    color: "#fff",
                    backgroundColor: "#1ED760",
                    height: 48,
                    m: 6,
                    "&:hover": {
                      transform: "scale(1.04)",
                      backgroundColor: "#21e065",
                    },
                  }}
                >
                  Remove Labour Works
                </Button>
              </div>
            )}
          </div>
        ))}
        <Button
          type="button"
          onClick={handleAddLabourWorksData}
          sx={{
            display: "inline-block",
            outline: "none",
            cursor: "pointer",
            fontSize: 14,
            lineHeight: 1,
            borderRadius: "500px",
            transitionProperty:
              "background-color, border-color, color, box-shadow, filter",
            transitionDuration: ".3s",
            border: "1px solid transparent",
            letterSpacing: 2,
            minWidth: 160,
            textTransform: "uppercase",
            whiteSpace: "normal",
            fontWeight: 700,
            textAlign: "center",
            padding: "17px 48px",
            color: "#fff",
            backgroundColor: "#1ED760",
            height: 48,
            m: 6,
            "&:hover": {
              transform: "scale(1.04)",
              backgroundColor: "#21e065",
            },
          }}
        >
          Add Labour Works
        </Button>

        <Typography variant="h5" sx={{ mb: "1em" }}>
          Total Cost: {labourWorksTotalCost}
        </Typography>

        <Typography variant="h3" sx={{ mb: "1em" }}>
          4. Total Amount
        </Typography>
        <div>
          <Typography variant="h5" sx={{ mb: "1em" }}>
            Customer-Name: {customerName}
          </Typography>
          <Typography variant="h5" sx={{ mb: "1em" }}>
            Purchase No: {purchaseNo}
          </Typography>
          <Typography variant="h5" sx={{ mb: "1em" }}>
            Date: {date}
          </Typography>
          <Typography variant="h5" sx={{ mb: "1em" }}>
            Raw-Material-Total Amount: {rawMaterialTotalAmount}
          </Typography>
          <Typography variant="h5" sx={{ mb: "1em" }}>
            Labour-Total Amount: {labourTotalAmount}
          </Typography>
          <Typography variant="h5" sx={{ mb: "1em" }}>
            Raw-Material-Total Amount: {rawMaterialTotalAmount}
          </Typography>
          <Typography variant="h5" sx={{ mb: "1em" }}>
            Actual Expenses: {actualExpenses}
          </Typography>
          <Typography variant="h5" sx={{ mb: "1em" }}>
            Net-Amount: {netAmount}
          </Typography>
        </div>
        <Button type="submit" onClick={handleSubmit}
        sx={{
          display: "inline-block",
          outline: "none",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          borderRadius: "500px",
          transitionProperty:
            "background-color, border-color, color, box-shadow, filter",
          transitionDuration: ".3s",
          border: "1px solid transparent",
          letterSpacing: 2,
          minWidth: 160,
          textTransform: "uppercase",
          whiteSpace: "normal",
          fontWeight: 700,
          textAlign: "center",
          padding: "17px 48px",
          color: "#fff",
          backgroundColor: "#1ED760",
          height: 48,
          m: 6,
          "&:hover": {
            transform: "scale(1.04)",
            backgroundColor: "#21e065",
          },
        }}
        >Download Excel Sheet</Button>
         
        <Button onClick={handleFormSubmit}
        sx={{
          display: "inline-block",
          outline: "none",
          cursor: "pointer",
          fontSize: 14,
          lineHeight: 1,
          borderRadius: "500px",
          transitionProperty:
            "background-color, border-color, color, box-shadow, filter",
          transitionDuration: ".3s",
          border: "1px solid transparent",
          letterSpacing: 2,
          minWidth: 160,
          textTransform: "uppercase",
          whiteSpace: "normal",
          fontWeight: 700,
          textAlign: "center",
          padding: "17px 48px",
          color: "#fff",
          backgroundColor: "#1ED760",
          height: 48,
          m: 6,
          "&:hover": {
            transform: "scale(1.04)",
            backgroundColor: "#21e065",
          },
        }}>
          Submit
        </Button>
        <Button
  
  onClick={handleIncompleteSubmit}
  sx={{
    display: "inline-block",
    outline: "none",
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
    borderRadius: "500px",
    transitionProperty:
      "background-color, border-color, color, box-shadow, filter",
    transitionDuration: ".3s",
    border: "1px solid transparent",
    letterSpacing: 2,
    minWidth: 160,
    textTransform: "uppercase",
    whiteSpace: "normal",
    fontWeight: 700,
    textAlign: "center",
    padding: "17px 48px",
    color: "#fff",
    backgroundColor: "#1ED760",
    height: 48,
    m: 6,
    "&:hover": {
      transform: "scale(1.04)",
      backgroundColor: "#21e065",
    },
  }}
>
  {formId ? "Update" : "Incomplete"}
</Button>
        </form>
        <Button
  
  onClick={handleAnalysisClick}
  sx={{
    display: "inline-block",
    outline: "none",
    cursor: "pointer",
    fontSize: 14,
    lineHeight: 1,
    borderRadius: "500px",
    transitionProperty:
      "background-color, border-color, color, box-shadow, filter",
    transitionDuration: ".3s",
    border: "1px solid transparent",
    letterSpacing: 2,
    minWidth: 160,
    textTransform: "uppercase",
    whiteSpace: "normal",
    fontWeight: 700,
    textAlign: "center",
    padding: "17px 48px",
    color: "#fff",
    backgroundColor: "#1ED760",
    height: 48,
    m: 6,
    "&:hover": {
      transform: "scale(1.04)",
      backgroundColor: "#21e065",
    },
  }}
>
  Analysis
</Button>
    </Container>
  );
};

export default IndexPage;
  
  

 
