import { PlainFile, ResourceMap, StringMap } from '../lib/types';
import { getFileName, hasValue, trim } from '../lib/util';

export default abstract class File {
    public appName: string = '';
    public stored: ResourceMap;
    private compression = 'zip';

    constructor(
        private directory: string,
        private processingTime: number,
        compression: string)
    {
        if (hasValue(compression)) {
            this.compression = compression;
        }
    }

    public abstract saveAllToDisk(data: StringMap): void;
    public abstract layoutAllToXml(data: StringMap, saveToDisk?: boolean): {};
    public abstract resourceAllToXml(saveToDisk?: boolean): {};
    public abstract resourceStringToXml(saveToDisk?: boolean): string;
    public abstract resourceStringArrayToXml(saveToDisk?: boolean): string;
    public abstract resourceFontToXml(saveToDisk?: boolean): string;
    public abstract resourceColorToXml(saveToDisk?: boolean): string;
    public abstract resourceStyleToXml(saveToDisk?: boolean): string;
    public abstract resourceDrawableToXml(saveToDisk?: boolean): string;

    protected saveToDisk(files: PlainFile[]) {
        if (!location.protocol.startsWith('http')) {
            alert('SERVER (required): See README for instructions');
            return;
        }
        if (files != null && files.length > 0) {
            fetch(`/api/savetodisk?directory=${encodeURIComponent(trim(this.directory, '/'))}&appname=${encodeURIComponent(this.appName.trim())}&filetype=${this.compression.toLocaleLowerCase()}&processingtime=${this.processingTime.toString().trim()}`, {
                    method: 'POST',
                    body: JSON.stringify(files),
                    headers: new Headers({ 'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json' })
                })
                .then((res: Response) => res.json())
                .then(json => {
                    if (json) {
                        if (json.zipname != null) {
                            fetch(`/api/downloadtobrowser?filename=${encodeURIComponent(json.zipname)}`)
                                .then((res: Response) => res.blob())
                                .then(blob => this.downloadToDisk(blob, getFileName(json.zipname)));
                        }
                        else if (json.system != null) {
                            alert(`${json.application}\n\n${json.system}`);
                        }
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