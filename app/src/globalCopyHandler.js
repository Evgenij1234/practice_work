const globalCopyHandler = (event) => {
    const target = event.target;
    if (target && target.dataset.copyText) {
      const textToCopy = target.dataset.copyText;
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('Text copied to clipboard:', textToCopy);
      }).catch(err => {
        console.error('Failed to copy text:', err);
      });
    }
  };
  
  export default globalCopyHandler;
  
