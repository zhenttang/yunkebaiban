import { useState, useEffect } from 'react';
import { AppContainer } from '../../components/app-container';
import { Input } from '@yunke/component';
import { Button } from '@yunke/component';
import { toast } from '@yunke/component';
import * as styles from './style.css';

interface Manifest {
  [category: string]: {
    [subcategory: string]: {
      _files: string[];
    } | string[];
    _files?: string[];
  };
}

export const Component = () => {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch('/undraw_svgs/manifest.json')
      .then(res => res.json())
      .then(data => setManifest(data))
      .catch(err => console.error('Failed to load manifest', err));
  }, []);

  const handleCopy = async (path: string) => {
    try {
      const response = await fetch(path);
      const svgText = await response.text();
      await navigator.clipboard.writeText(svgText);
      toast('SVG code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy SVG', err);
      toast('Failed to copy SVG');
    }
  };

  const renderFiles = (files: string[], basePath: string) => {
    return (
      <div className={styles.grid}>
        {files.map(file => {
          const fullPath = `${basePath}/${file}`;
          if (searchTerm && !file.toLowerCase().includes(searchTerm.toLowerCase())) {
            return null;
          }
          return (
            <div key={fullPath} className={styles.card}>
              <div className={styles.imageContainer}>
                <img src={fullPath} alt={file} className={styles.image} />
              </div>
              <div className={styles.cardFooter}>
                <span className={styles.fileName} title={file}>{file}</span>
                <Button onClick={() => handleCopy(fullPath)} size="default" style={{ height: '28px', fontSize: '12px' }}>
                  Copy SVG
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCategory = (categoryName: string, content: any, pathPrefix: string) => {
    const files = content._files || [];
    const subcategories = Object.keys(content).filter(k => k !== '_files');

    return (
      <div key={pathPrefix} className={styles.categorySection}>
        <h2 className={styles.categoryTitle}>{categoryName}</h2>
        {files.length > 0 && renderFiles(files, pathPrefix)}
        {subcategories.map(sub => (
          <div key={sub} className={styles.subcategorySection}>
            <h3 className={styles.subcategoryTitle}>{sub}</h3>
            {renderCategory(sub, content[sub], `${pathPrefix}/${sub}`)}
          </div>
        ))}
      </div>
    );
  };

  if (!manifest) {
    return <AppContainer>Loading...</AppContainer>;
  }

  return (
    <AppContainer>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Undraw SVG Gallery</h1>
          <div className={styles.searchContainer}>
            <Input
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(value: string) => setSearchTerm(value)}
              className={styles.searchInput}
            />
          </div>
        </header>
        
        <div className={styles.content}>
          {Object.entries(manifest).map(([category, content]) => {
             if (selectedCategory && selectedCategory !== category) return null;
             return renderCategory(category, content, `/undraw_svgs/${category}`);
          })}
        </div>
      </div>
    </AppContainer>
  );
};