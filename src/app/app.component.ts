/// <reference types="@types/chrome" />

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
      <div class="container">
          <h1>{{ title }}</h1>
          <div class="bookmark">
              @for (item of bookmarks;track item.id) {
                  <div class="bookmark__item">
                      <h3><span class="unique-identifier">{{ item.id }}.</span> <a [href]="item.url"
                                                                                   target="_blank">{{ item.title }}</a>
                      </h3>
                      <svg
                              (click)="delete(item)"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                      >
                          <path
                                  d="M8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13H16C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11H8Z"
                                  fill="currentColor"
                          />
                          <path
                                  fill-rule="evenodd"
                                  clip-rule="evenodd"
                                  d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12ZM21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                  fill="currentColor"
                          />
                      </svg>
                  </div>
              } @empty {
                  <p class="bookmark__item">There are no bookmarks.</p>
              }
          </div>
      </div>
  `,
  styles: [
    `
      .container {
        width: 45rem;
        margin: 2em;

        .bookmark {
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;

          &__item {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 50px;
            align-items: center;

            svg {
              cursor: pointer;
            }

            h3 {
              padding-right: 1.5em;
            }

            .unique-identifier {
              padding: 0 1.5em;
            }
          }
        }
      }
    `,
  ],
})
export class AppComponent implements OnInit {
  title = 'Chrome bookmarks extension';
  bookmarks: BookmarkNode[] = [];

  ngOnInit(): void {
    (async () => {
      const tree: BookmarkTreeNode[] = await chrome.bookmarks?.getTree();
      this.bookmarks = this.extractAllChildren(tree);
    })();
  }

  extractAllChildren(data: BookmarkTreeNode[]): BookmarkNode[] {
    let extractedData: BookmarkNode[] = [];
    let stack: BookmarkTreeNode[][] = [data]; // Initialize the stack with the top-level nodes

    while (stack.length > 0) {
      const currentChildren: BookmarkTreeNode[] = stack.pop(); // Pop the next level of nodes from the stack
      for (const child of currentChildren) {
        if (child.url) {
          extractedData = [
            ...extractedData,
            {
              dateAdded: child.dateAdded,
              id: child.id,
              index: child.index,
              parentId: child.parentId,
              title: child.title,
              url: child.url,
            },
          ];
        } else if (child.children) {
          stack = [...stack, child.children];
        }
      }
    }

    return extractedData.sort(
      (a: BookmarkNode, b: BookmarkNode) => Number(a.id) - Number(b.id),
    );
  }

  async delete(item: BookmarkNode) {
    await chrome.bookmarks.remove(item.id);
    location.reload(); // Refresh the popup
  }
}

export interface BookmarkNode {
  dateAdded: number;
  id: string;
  index: number;
  parentId: string;
  title: string;
  url?: string | null;
  dateLastUsed?: number | null;
}
