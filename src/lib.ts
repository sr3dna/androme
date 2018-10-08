import Node from './base/node';
import NodeList from './base/nodelist';
import NodeGroup from './base/nodegroup';
import Application from './base/application';
import Controller from './base/controller';
import Resource from './base/resource';
import File from './base/file';
import Extension from './base/extension';

import * as enumeration from './lib/enumeration';
import * as constant from './lib/constant';
import * as util from './lib/util';
import * as dom from './lib/dom';
import * as xml from './lib/xml';
import * as color from './lib/color';

import Accessibility from './extension/accessibility';
import Button from './extension/button';
import Custom from './extension/custom';
import External from './extension/external';
import Grid from './extension/grid';
import List from './extension/list';
import Nav from './extension/nav';
import Origin from './extension/origin';
import Table from './extension/table';

const base = {
    extensions: {
        Accessibility,
        Button,
        Custom,
        External,
        Grid,
        List,
        Nav,
        Origin,
        Table
    },
    Node,
    NodeList,
    NodeGroup,
    Application,
    Controller,
    Resource,
    File,
    Extension
};

export { base, enumeration, constant, util, dom, xml, color };