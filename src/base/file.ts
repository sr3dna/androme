import { PlainFile, ResourceMap, StringMap, ViewData } from '../lib/types';
import Node from './node';
import NodeList from './nodelist';
import { lastIndexOf, trimString } from '../lib/util';

export default abstract class File<T extends Node> {
    public appName = '';
    public stored: ResourceMap;

    protected readonly queue: PlainFile[] = [];

    private _compression = 'zip';

    constructor(
        private _directory: string,
        private _processingTime: number,
        compression: string)
    {
        if (compression) {
            this._compression = compression;
        }
    }

    public abstract saveAllToDisk(data: ViewData<NodeList<T>>): void;
    public abstract layoutAllToXml(data: ViewData<NodeList<T>>, saveToDisk?: boolean): StringMap;
    public abstract resourceAllToXml(saveToDisk?: boolean): StringMap;
    public abstract resourceStringToXml(saveToDisk?: boolean): string;
    public abstract resourceStringArrayToXml(saveToDisk?: boolean): string;
    public abstract resourceFontToXml(saveToDisk?: boolean): string;
    public abstract resourceColorToXml(saveToDisk?: boolean): string;
    public abstract resourceStyleToXml(saveToDisk?: boolean): string;
    public abstract resourceDimenToXml(saveToDisk?: boolean): string;
    public abstract resourceDrawableToXml(saveToDisk?: boolean): string;

    public addFile(pathname: string, filename: string, content: string, uri: string) {
        if (content !== '' || uri !== '') {
            const index = this.queue.findIndex(item => item.pathname === pathname && item.filename === filename);
            if (index !== -1) {
                this.queue[index].content = content || '';
                this.queue[index].uri = uri || '';
            }
            else {
                this.queue.push({ pathname, filename, content, uri });
            }
        }
    }

    public reset() {
        this.queue.length = 0;
    }

    protected saveToDisk(files: PlainFile[]) {
        if (!location.protocol.startsWith('http')) {
            alert('SERVER (required): See README for instructions');
            return;
        }
        if (Array.isArray(files) && files.length > 0) {
            files.push(...this.queue);
            fetch(`/api/savetodisk?directory=${encodeURIComponent(trimString(this._directory, '/'))}&appname=${encodeURIComponent(this.appName.trim())}&filetype=${this._compression.toLocaleLowerCase()}&processingtime=${this._processingTime.toString().trim()}`, {
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
                                .then(blob => this.downloadToDisk(blob, lastIndexOf(json.zipname)));
                        }
                        else if (json.system != null) {
                            alert(`${json.application}\n\n${json.system}`);
                        }
                    }
                })
                .catch(err => alert(`ERROR: ${err}`));
        }
    }

    private downloadToDisk(data: Blob, filename: string, mime = '') {
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