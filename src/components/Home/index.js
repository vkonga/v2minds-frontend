import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Provider,
  defaultTheme,
  lightTheme,
  darkTheme,
  TableView,
  TableHeader,
  Column,
  TableBody,
  Row,
  Cell,
  View,
  ButtonGroup,
  Button,
  Breadcrumbs,
  Item,
  Link
} from '@adobe/react-spectrum';
import './index.css';

const Home = () => {
  const [items, setItems] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(defaultTheme);
  const [selectedKeys, setSelectedKeys] = useState(new Set());
  const [container, setContainer] = useState([]);
  const [containerSelectedKeys, setContainerSelectedKeys] = useState(new Set());

  const fetchDirectory = async (path = '') => {
    try {
      const response = await axios.get('https://v2minds-backend.onrender.com/list-directory', {
        params: { path }
      });
      setItems(response.data);
      setCurrentPath(path);
      setSelectedFile(null);
      setSelectedKeys(new Set());
    } catch (error) {
      setError('Failed to load directory contents');
    }
  };

  useEffect(() => {
    const storedContainer = JSON.parse(localStorage.getItem('selectedContainer')) || [];
    setContainer(storedContainer);
    fetchDirectory();
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedContainer', JSON.stringify(container));
  }, [container]);

  useEffect(() => {
    const fetchFile = async () => {
      if (selectedFile) {
        try {
          const response = await axios.get(`https://v2minds-backend.onrender.com/static/${currentPath}/${selectedFile}`);
          setFileContent(response.data);
        } catch (error) {
          setError('Failed to load file');
        }
      }
    };

    fetchFile();
  }, [selectedFile, currentPath]);

  const isFolderFullySelected = (folder) => {
    if (!folder.contents) return false;

    // Create a set of selected keys
    const selectedKeysSet = new Set(selectedKeys);

    // Check if every item in the folder is selected
    return folder.contents.every(child => selectedKeysSet.has(child.name));
  };

  const handleSelectionChange = (keys) => {
    setSelectedKeys(keys);

    const updatedContainer = [];
    const selectedItems = new Set(keys);

    items.forEach(item => {
      if (item.type === 'directory') {
        const contents = item.contents || [];

        // If the folder is fully selected or contains selected items, add it to the container
        if (isFolderFullySelected(item)) {
          updatedContainer.push({
            type: 'directory',
            name: item.name,
            contents
          });
        } else {
          const selectedContents = contents.filter(child => selectedItems.has(child.name));
          if (selectedContents.length > 0) {
            updatedContainer.push({
              type: 'directory',
              name: item.name,
              contents: selectedContents
            });
          }
        }
      } else if (selectedItems.has(item.name)) {
        updatedContainer.push({
          type: 'file',
          name: item.name
        });
      }
    });

    // Ensure that directories with selected contents are added to the container
    items.forEach(item => {
      if (item.type === 'directory' && selectedItems.has(item.name)) {
        const contents = item.contents || [];
        updatedContainer.push({
          type: 'directory',
          name: item.name,
          contents
        });
      }
    });

    setContainer(updatedContainer);
  };

  const handleContainerSelectionChange = (keys) => {
    setContainerSelectedKeys(keys);
  };

  const handleBreadcrumbClick = (key) => {
    const newPath = key === 'root' ? '' : key;
    fetchDirectory(newPath);
  };

  const handleNameClick = (item) => {
    if (item.type === 'directory') {
      const newPath = currentPath ? `${currentPath}/${item.name}` : item.name;
      fetchDirectory(newPath);
    } else {
      setSelectedFile(item.name);
    }
  };

  const handleDelete = () => {
    const updatedContainer = container.filter(item => !containerSelectedKeys.has(item.name));
    setContainer(updatedContainer);
    setContainerSelectedKeys(new Set());
  };

  const renderContainer = () => {
    return (
      <TableView
        selectionMode="multiple"
        aria-label="Container contents"
        onSelectionChange={handleContainerSelectionChange}
        selectedKeys={containerSelectedKeys}
      >
        <TableHeader>
          <Column key="type">Type</Column>
          <Column key="name">Name</Column>
        </TableHeader>
        <TableBody>
          {container.map(item => (
            <Row key={item.name}>
              <Cell>{item.type === 'directory' ? '📁' : '📄'}</Cell>
              <Cell>
                <Link onPress={() => handleNameClick(item)}>{item.name}</Link>
              </Cell>
            </Row>
          ))}
        </TableBody>
      </TableView>
    );
  };

  return (
    <Provider theme={theme} colorScheme={theme === lightTheme ? 'light' : 'dark'}>
      <View padding="size-200" className="container">
        <ButtonGroup>
          <Button variant="primary" onPress={() => setTheme(lightTheme)}>Light Theme</Button>
          <Button variant="secondary" onPress={() => setTheme(darkTheme)}>Dark Theme</Button>
        </ButtonGroup>

        <Breadcrumbs className="breadcrumbs" onAction={(key) => handleBreadcrumbClick(key)}>
          <Item key="root">Root</Item>
          {currentPath.split('/').filter(Boolean).map((folder, index) => (
            <Item key={currentPath.split('/').slice(0, index + 1).join('/')}>
              {folder}
            </Item>
          ))}
        </Breadcrumbs>

        <div className="table-container">
          {error && <div>{error}</div>}
          <TableView
            aria-label="Directory contents"
            selectionMode="multiple"
            onSelectionChange={handleSelectionChange}
            selectedKeys={selectedKeys}
          >
            <TableHeader>
              <Column key="type">Type</Column>
              <Column key="name">Name</Column>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <Row key={item.name}>
                  <Cell>{item.type === 'directory' ? '📁' : '📄'}</Cell>
                  <Cell>
                    <Link onPress={() => handleNameClick(item)}>{item.name}</Link>
                  </Cell>
                </Row>
              ))}
            </TableBody>
          </TableView>
        </div>

        <h2>Container</h2>
        {containerSelectedKeys.size > 0 && (
          <Button variant="negative" onPress={handleDelete}>Delete Selected</Button>
        )}
        {renderContainer()}
      </View>
    </Provider>
  );
};

export default Home;
