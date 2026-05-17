import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import axios from 'react-router-dom';
import axiosInstance from 'axios';

const API_URL = 'https://api.bbipl.org/api';

function FormBuilder() {
  const [title, setTitle] = useState('');
  const [fields, setFields] = useState([]);
  const [publishedData, setPublishedData] = useState(null);

  const addField = (type) => {
    const newField = {
      id: Date.now().toString(),
      type,
      label: '',
      required: true,
      options: ['Option 1'],
      rows: ['Row 1'],
      columns: ['Column 1']
    };
    setFields([...fields, newField]);
  };

  const updateField = (id, key, value) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const addListItem = (id, key, label) => {
    setFields(fields.map((f) => {
      if (f.id === id) {
        return { ...f, [key]: [...f[key], `${label} ${f[key].length + 1}`] };
      }
      return f;
    }));
  };

  const updateListItem = (id, key, index, value) => {
    setFields(fields.map((f) => {
      if (f.id === id) {
        const newList = [...f[key]];
        newList[index] = value;
        return { ...f, [key]: newList };
      }
      return f;
    }));
  };

  const saveForm = async () => {
    try {
      const res = await axiosInstance.post(`${API_URL}/forms`, { title, fields });
      const fLink = `${window.location.origin}/form/${res.data.formId}`;
      const dLink = `${window.location.origin}/dashboard/${res.data.formId}`;
      setPublishedData({
        formLink: fLink,
        dashboardLink: dLink,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(fLink)}`
      });
    } catch (error) {
      alert("Error saving form: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: 'auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ background: 'white', padding: '30px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderTop: '8px solid #007bff' }}>
        <h2>Custom Form Generator</h2>
        <input
          type="text"
          placeholder="Untitled Form"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: '95%', padding: '12px', fontSize: '22px', marginBottom: '20px', border: 'none', borderBottom: '2px solid #ccc', outline: 'none' }}
        />

        {fields.map((field, index) => (
          <div key={field.id} style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '15px', borderRadius: '8px', background: '#fdfdfd' }}>
            <span style={{ background: '#007bff', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              Q{index + 1}: {field.type.toUpperCase()}
            </span>
            <input
              type="text"
              placeholder="Enter Question Text"
              value={field.label}
              onChange={(e) => updateField(field.id, 'label', e.target.value)}
              style={{ width: '95%', padding: '10px', margin: '10px 0', fontSize: '16px', borderRadius: '4px', border: '1px solid #ccc' }}
            />

            {['radio', 'checkbox', 'dropdown'].includes(field.type) && (
              <div>
                {field.options.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    value={opt}
                    onChange={(e) => updateListItem(field.id, 'options', i, e.target.value)}
                    style={{ display: 'block', margin: '5px 0', padding: '5px' }}
                  />
                ))}
                <button onClick={() => addListItem(field.id, 'options', 'Option')} style={{ marginTop: '5px' }}>+ Add Option</button>
              </div>
            )}

            {['grid-radio', 'grid-checkbox'].includes(field.type) && (
              <div style={{ display: 'flex', gap: '20px' }}>
                <div>
                  <h4>Rows</h4>
                  {field.rows.map((row, i) => (
                    <input key={i} type="text" value={row} onChange={(e) => updateListItem(field.id, 'rows', i, e.target.value)} style={{ display: 'block', margin: '3px 0' }} />
                  ))}
                  <button onClick={() => addListItem(field.id, 'rows', 'Row')}>+ Add Row</button>
                </div>
                <div>
                  <h4>Columns</h4>
                  {field.columns.map((col, i) => (
                    <input key={i} type="text" value={col} onChange={(e) => updateListItem(field.id, 'columns', i, e.target.value)} style={{ display: 'block', margin: '3px 0' }} />
                  ))}
                  <button onClick={() => addListItem(field.id, 'columns', 'Column')}>+ Add Column</button>
                </div>
              </div>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '20px' }}>
          <button onClick={() => addField('text')}>Short Answer</button>
          <button onClick={() => addField('paragraph')}>Paragraph</button>
          <button onClick={() => addField('radio')}>Multiple Choice</button>
          <button onClick={() => addField('checkbox')}>Checkbox</button>
          <button onClick={() => addField('dropdown')}>Dropdown</button>
          <button onClick={() => addField('file')}>File Upload</button>
          <button onClick={() => addField('rating')}>Rating</button>
          <button onClick={() => addField('grid-radio')}>Multiple Choice Grid</button>
          <button onClick={() => addField('grid-checkbox')}>Checkbox Grid</button>
          <button onClick={() => addField('date')}>Date</button>
          <button onClick={() => addField('time')}>Time</button>
        </div>

        <button onClick={saveForm} style={{ display: 'block', marginTop: '30px', background: '#28a745', color: 'white', padding: '12px 25px', border: 'none', borderRadius: '5px', fontSize: '16px', cursor: 'pointer' }}>
          Generate Form & QR Code
        </button>

        {publishedData && (
          <div style={{ marginTop: '20px', padding: '20px', background: '#e2f0d9', border: '1px solid #385723', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Generated Successfully!</h3>
              <p><strong>Form Link:</strong> <a href={publishedData.formLink} target="_blank" rel="noopener noreferrer">{publishedData.formLink}</a></p>
              <p><strong>Dashboard:</strong> <a href={publishedData.dashboardLink} target="_blank" rel="noopener noreferrer">{publishedData.dashboardLink}</a></p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <img src={publishedData.qrCodeUrl} alt="Form QR Code" style={{ border: '1px solid #ccc', padding: '5px', background: 'white' }} />
              <br /><small>Scan to Fill Form</small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormViewer() {
  const { formId } = useParams();
  const [formData, setFormData] = useState(null);
  const [responses, setResponses] = useState({});
  const [files, setFiles] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await axiosInstance.get(`${API_URL}/forms/${formId}`);
        setFormData(res.data);
      } catch (error) {
        alert("Form not found");
      }
    };
    fetchForm();
  }, [formId]);

  const handleSimpleChange = (qId, val) => {
    setResponses({ ...responses, [qId]: val });
  };

  const handleCheckboxChange = (qId, option, checked) => {
    const current = responses[qId] ? JSON.parse(responses[qId]) : [];
    let updated;
    if (checked) {
      updated = [...current, option];
    } else {
      updated = current.filter((o) => o !== option);
    }
    setResponses({ ...responses, [qId]: JSON.stringify(updated) });
  };

  const handleGridChange = (qId, row, col, isCheckbox) => {
    const current = responses[qId] ? JSON.parse(responses[qId]) : {};
    if (isCheckbox) {
      const rowVals = current[row] || [];
      if (rowVals.includes(col)) {
        current[row] = rowVals.filter((v) => v !== col);
      } else {
        current[row] = [...rowVals, col];
      }
    } else {
      current[row] = col;
    }
    setResponses({ ...responses, [qId]: JSON.stringify(current) });
  };

  const submitForm = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(responses).forEach((key) => data.append(key, responses[key]));
    Object.keys(files).forEach((key) => data.append(key, files[key]));

    try {
      await axiosInstance.post(`${API_URL}/responses/${formId}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitted(true);
    } catch (error) {
      alert("Submission failed");
    }
  };

  if (!formData) return <div>Loading Form...</div>;
  if (submitted) return <div style={{ padding: '5px', textAlign: 'center' }}><h2>Response Recorded!</h2></div>;

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: 'auto' }}>
      <form onSubmit={submitForm} style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h1>{formData.title}</h1>
        {formData.fields.map((field) => (
          <div key={field.id} style={{ marginBottom: '25px', padding: '15px', border: '1px solid #eee', borderRadius: '6px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>{field.label}</label>

            {field.type === 'text' && <input type="text" onChange={(e) => handleSimpleChange(field.id, e.target.value)} required style={{ width: '90%' }} />}
            {field.type === 'paragraph' && <textarea onChange={(e) => handleSimpleChange(field.id, e.target.value)} required style={{ width: '90%', height: '80px' }} />}
            {field.type === 'date' && <input type="date" onChange={(e) => handleSimpleChange(field.id, e.target.value)} required />}
            {field.type === 'time' && <input type="time" onChange={(e) => handleSimpleChange(field.id, e.target.value)} required />}
            {field.type === 'file' && <input type="file" onChange={(e) => setFiles({ ...files, [field.id]: e.target.files[0] })} required />}

            {field.type === 'dropdown' && (
              <select onChange={(e) => handleSimpleChange(field.id, e.target.value)} required>
                <option value="">Select Option</option>
                {field.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
              </select>
            )}

            {field.type === 'radio' && field.options.map((opt, i) => (
              <div key={i}><label><input type="radio" name={field.id} value={opt} onChange={(e) => handleSimpleChange(field.id, e.target.value)} required /> {opt}</label></div>
            ))}

            {field.type === 'checkbox' && field.options.map((opt, i) => (
              <div key={i}><label><input type="checkbox" onChange={(e) => handleCheckboxChange(field.id, opt, e.target.checked)} /> {opt}</label></div>
            ))}

            {field.type === 'rating' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3, 4, 5].map((num) => (
                  <label key={num}><input type="radio" name={field.id} value={num} onChange={(e) => handleSimpleChange(field.id, e.target.value)} required /> {num}★</label>
                ))}
              </div>
            )}

            {['grid-radio', 'grid-checkbox'].includes(field.type) && (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                  <tr>
                    <th></th>
                    {field.columns.map((col, cIdx) => <th key={cIdx}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {field.rows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{row}</td>
                      {field.columns.map((col, cIdx) => (
                        <td key={cIdx} style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                          <input
                            type={field.type === 'grid-radio' ? 'radio' : 'checkbox'}
                            name={`${field.id}-${row}`}
                            onChange={(e) => handleGridChange(field.id, row, col, field.type === 'grid-checkbox')}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
        <button type="submit" style={{ background: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Submit Response</button>
      </form>
    </div>
  );
}

function Dashboard() {
  const { formId } = useParams();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const res = await axiosInstance.get(`${API_URL}/responses/${formId}`);
        setResponses(res.data);
      } catch (error) {
        alert("Error fetching dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchResponses();
  }, [formId]);

  if (loading) return <div>Loading Panel...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>Dynamic Responses Table ({responses.length})</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ background: '#f4f4f4', borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Time</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Submissions Data</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((resp) => (
              <tr key={resp.responseId} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px', verticalAlign: 'top' }}>{new Date(resp.submittedAt).toLocaleString()}</td>
                <td style={{ padding: '10px' }}>
                  {Object.entries(resp.answers).map(([qId, ans]) => (
                    <div key={qId} style={{ marginBottom: '8px', background: '#fdfdfd', padding: '6px', borderLeft: '3px solid #007bff' }}>
                      <span style={{ fontSize: '11px', color: '#888' }}>Question ID: {qId}</span><br />
                      <strong>Value: </strong>
                      {typeof ans === 'string' && ans.startsWith('http') ? (
                        <a href={ans} target="_blank" rel="noopener noreferrer">📄 View Uploaded File</a>
                      ) : (
                        ans
                      )}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '10px 0' }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<FormBuilder />} />
          <Route path="/form/:formId" element={<FormViewer />} />
          <Route path="/dashboard/:formId" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;