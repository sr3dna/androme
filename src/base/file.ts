import { IPlainFile, IResourceMap } from '../lib/types';
import { getFilename, hasValue, trim } from '../lib/util';

export default abstract class File {
    public stored: IResourceMap;
    private filetype = 'zip';

    constructor(
        private directory: string,
        private appname: string,
        filetype?: string)
    {
        if (filetype != null) {
            this.filetype = filetype;
        }
    }

    public abstract layoutMainToDisk(content: string): void;
    public abstract resourceStringToXml(saveToDisk?: boolean): string;
    public abstract resourceStringArrayToXml(saveToDisk?: boolean): string;
    public abstract resourceFontToXml(saveToDisk?: boolean): string;
    public abstract resourceColorToXml(saveToDisk?: boolean): string;
    public abstract resourceStyleToXml(saveToDisk?: boolean): string;
    public abstract resourceDrawableToXml(saveToDisk?: boolean): string;
    public abstract resourceAllToXml(saveToDisk?: boolean, layoutMain?: string): {};

    protected saveToDisk(files: IPlainFile[]) {
        if (files != null && files.length > 0) {
            fetch(`/api/savetodisk?directory=${encodeURIComponent(trim(this.directory, '/'))}&appname=${encodeURIComponent(this.appname.trim())}&filetype=${this.filetype.toLocaleLowerCase()}`, {
                method: 'POST',
                body: JSON.stringify(files),
                headers: new Headers({ 'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json' })
            })
            .then((res: Response) => {
                return res.json();
            })
            .then(json => {
                if (json && hasValue(json.zipname)) {
                    fetch(`/api/downloadtobrowser?filename=${encodeURIComponent(json.zipname)}`)
                    .then(res => res.blob())
                    .then(blob => {
                        this.downloadToDisk(blob, getFilename(json.zipname));
                    });
                }
            })
            .catch(err => alert(`ERROR: ${err}`));
        }
    }

    private downloadToDisk(data, filename, mime = '') {
        const blob = new Blob([data], { type: mime || 'application/octet-stream' });
        if (typeof window.navigator.msSaveBlob !== 'undefined') {
            window.navigator.msSaveBlob(blob, filename);
            return;
        }
        const url = window.URL.createObjectURL(blob);
        const element = document.createElement('a');
        element.style.display = 'none';
        element.href = url;
        element.setAttribute('download', filename);
        if (typeof element.download === 'undefined') {
            element.setAttribute('target', '_blank');
        }
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
    }
}